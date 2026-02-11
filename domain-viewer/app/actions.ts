"use server"

import { headers } from "next/headers"
import { createHash } from "crypto"
import PosemeshServerApi from "@/utils/posemeshServerApi"
import { appendRewardsSubmission, type RewardsFormData } from "@/lib/googleSheets"

// Domain server URL for fetching domain list
const DOMAIN_SERVER_URL = "https://domain-server-us-east-1.aukiverse.com"

/**
 * Response type for domain information requests.
 * Contains either successful domain data or error information.
 */
interface DomainInfoResult {
  success: boolean
  data?: {
    domainInfo: any // Domain metadata
    domainAccessToken: string // Authentication token for domain access
    domainServerUrl: string // Base URL for domain server
  }
  error?: string // Error message if request fails
}

/**
 * Domain list item from the domain server
 */
export interface DomainListItem {
  id: string
  name: string
  created_at: string
  updated_at: string
}

/**
 * Response type for domain list requests
 */
interface DomainListResult {
  success: boolean
  data?: DomainListItem[]
  error?: string
}

/**
 * Server action that fetches domain information and authentication tokens.
 * This function handles the initial authentication flow required to access domain data:
 * 1. Authenticates with Auki Network using app credentials
 * 2. Authenticates with the specific domain
 * 3. Returns domain metadata and access tokens
 * 
 * @param domainId - Unique identifier for the domain to fetch
 * @param posemeshClientId - Client identifier for tracking API requests
 * @returns Promise containing domain information or error details
 * @throws Error if Auki Network credentials are not configured
 */
export async function fetchDomainInfo(domainId: string, posemeshClientId: string): Promise<DomainInfoResult> {
  const apiClient = new PosemeshServerApi(posemeshClientId)
  console.log(`[${new Date().toISOString()}] Starting fetchDomainInfo for domainId: ${domainId}`)

  try {
    // Verify environment variables are configured
    const appKey = process.env.AUKI_APP_KEY
    const appSecret = process.env.AUKI_APP_SECRET

    if (!appKey || !appSecret) {
      throw new Error("Auki Network credentials are not configured")
    }

    // Authenticate with API server
    console.log(`[${new Date().toISOString()}] Authenticating with API server`)
    await apiClient.authenticate(appKey, appSecret)
    console.log(`[${new Date().toISOString()}] Authentication successful`)

    // Authenticate with domain
    console.log(`[${new Date().toISOString()}] Authenticating with domain`)
    const domainAuthData = await apiClient.authenticateDomain(domainId)
    console.log(`[${new Date().toISOString()}] Domain authentication successful`)

    // Return formatted domain information
    return {
      success: true,
      data: {
        domainInfo: {
          id: domainId,
          name: domainAuthData.name,
          createdAt: domainAuthData.created_at,
          updatedAt: domainAuthData.updated_at,
          url: domainAuthData.domain_server.url,
          ip: domainAuthData.domain_server.ip,
        },
        domainAccessToken: domainAuthData.access_token,
        domainServerUrl: domainAuthData.domain_server.url,
      },
    }
  } catch (error) {
    console.error(`[${new Date().toISOString()}] Error in fetchDomainInfo:`, error)
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    }
  }
}

/**
 * Server action that fetches the list of available domains from the domain server.
 *
 * @returns Promise containing array of domain items or error details
 */
export async function fetchDomainList(): Promise<DomainListResult> {
  console.log(`[${new Date().toISOString()}] Fetching domain list from ${DOMAIN_SERVER_URL}`)

  try {
    const appKey = process.env.AUKI_APP_KEY
    const appSecret = process.env.AUKI_APP_SECRET

    if (!appKey || !appSecret) {
      throw new Error("Auki Network credentials are not configured")
    }

    // First authenticate to get access token
    const API_SERVER = process.env.AUKI_API_SERVER
    if (!API_SERVER) {
      throw new Error("AUKI_API_SERVER environment variable is not set")
    }

    console.log(`[${new Date().toISOString()}] Authenticating with ${API_SERVER}`)
    const basic = Buffer.from(`${appKey}:${appSecret}`).toString('base64')
    const authResponse = await fetch(`${API_SERVER}/service/domains-access-token`, {
      method: 'POST',
      headers: {
        "Authorization": `Basic ${basic}`,
        "User-Agent": "domain-viewer",
        "Accept": "application/json",
      }
    })

    if (!authResponse.ok) {
      const errorText = await authResponse.text().catch(() => '')
      console.error(`[${new Date().toISOString()}] Auth failed:`, authResponse.status, errorText)
      throw new Error(`Authentication failed: ${authResponse.status} ${authResponse.statusText}`)
    }

    const authData = await authResponse.json()
    const accessToken = authData.access_token
    console.log(`[${new Date().toISOString()}] Authentication successful, fetching domains...`)

    // Fetch domain list from the domain server
    const response = await fetch(`${DOMAIN_SERVER_URL}/api/v1/domains`, {
      headers: {
        "Authorization": `Bearer ${accessToken}`,
        "User-Agent": "domain-viewer",
        "Accept": "application/json",
      }
    })

    if (!response.ok) {
      const errorText = await response.text().catch(() => '')
      console.error(`[${new Date().toISOString()}] Domain list fetch failed:`, response.status, errorText)
      throw new Error(`Failed to fetch domains: ${response.status} ${response.statusText}`)
    }

    const data = await response.json()
    console.log(`[${new Date().toISOString()}] Fetched ${data.domains?.length || 0} domains`)
    console.log(`[${new Date().toISOString()}] Response keys:`, Object.keys(data))

    return {
      success: true,
      data: data.domains || [],
    }
  } catch (error) {
    console.error(`[${new Date().toISOString()}] Error fetching domain list:`, error)
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    }
  }
}

// ============ REWARDS FORM ============

// Rate limiting: Map of IP hash -> array of timestamps
const rateLimitMap = new Map<string, number[]>()
const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000 // 1 hour
const RATE_LIMIT_MAX_REQUESTS = 10

interface RewardsFormResult {
  success: boolean
  error?: string
}

function hashIP(ip: string): string {
  return createHash('sha256').update(ip + (process.env.IP_HASH_SALT || 'default-salt')).digest('hex').slice(0, 16)
}

function checkRateLimit(ipHash: string): boolean {
  const now = Date.now()
  const timestamps = rateLimitMap.get(ipHash) || []

  // Filter to only recent timestamps within the window
  const recentTimestamps = timestamps.filter(t => now - t < RATE_LIMIT_WINDOW_MS)

  if (recentTimestamps.length >= RATE_LIMIT_MAX_REQUESTS) {
    return false // Rate limited
  }

  // Add current timestamp and update map
  recentTimestamps.push(now)
  rateLimitMap.set(ipHash, recentTimestamps)

  // Cleanup old entries periodically (every 100 checks)
  if (Math.random() < 0.01) {
    for (const [key, times] of rateLimitMap.entries()) {
      const filtered = times.filter(t => now - t < RATE_LIMIT_WINDOW_MS)
      if (filtered.length === 0) {
        rateLimitMap.delete(key)
      } else {
        rateLimitMap.set(key, filtered)
      }
    }
  }

  return true
}

async function verifyRecaptchaToken(token: string): Promise<boolean> {
  const secretKey = process.env.RECAPTCHA_SECRET_KEY

  if (!secretKey) {
    console.error('RECAPTCHA_SECRET_KEY not configured')
    return false
  }

  try {
    const response = await fetch('https://www.google.com/recaptcha/api/siteverify', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        secret: secretKey,
        response: token,
      }),
    })

    const data = await response.json()

    // reCAPTCHA v3 returns a score (0.0 to 1.0)
    // 1.0 is very likely a good interaction, 0.0 is very likely a bot
    // We require a score of 0.5 or higher
    if (!data.success) {
      return false
    }

    // If score exists (v3), check threshold
    if (typeof data.score === 'number') {
      return data.score >= 0.5
    }

    return true
  } catch (error) {
    console.error('reCAPTCHA verification failed:', error)
    return false
  }
}

function validateWalletAddress(address: string): boolean {
  // Basic Ethereum address validation (0x + 40 hex chars)
  return /^0x[a-fA-F0-9]{40}$/.test(address)
}

function validateEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

export async function submitRewardsForm(formData: FormData): Promise<RewardsFormResult> {
  try {
    // Get client IP for rate limiting
    const headersList = await headers()
    const forwardedFor = headersList.get('x-forwarded-for')
    const realIp = headersList.get('x-real-ip')
    const clientIP = forwardedFor?.split(',')[0]?.trim() || realIp || 'unknown'
    const ipHash = hashIP(clientIP)

    // Check rate limit
    if (!checkRateLimit(ipHash)) {
      return {
        success: false,
        error: 'Too many submissions. Please try again later.',
      }
    }

    // Extract form fields
    const domainId = formData.get('domainId')?.toString().trim()
    const description = formData.get('description')?.toString().trim()
    const city = formData.get('city')?.toString().trim()
    const walletAddress = formData.get('walletAddress')?.toString().trim()
    const name = formData.get('name')?.toString().trim()
    const email = formData.get('email')?.toString().trim()
    const discord = formData.get('discord')?.toString().trim()
    const twitter = formData.get('twitter')?.toString().trim()
    const agreed = formData.get('agreed') === 'true'
    const recaptchaToken = formData.get('recaptchaToken')?.toString()

    // Validate required fields
    if (!domainId) {
      return { success: false, error: 'Domain ID is required' }
    }
    if (!description) {
      return { success: false, error: 'Description is required' }
    }
    if (description.length > 500) {
      return { success: false, error: 'Description must be 500 characters or less' }
    }
    if (!walletAddress) {
      return { success: false, error: 'Wallet address is required' }
    }
    if (!validateWalletAddress(walletAddress)) {
      return { success: false, error: 'Invalid wallet address format. Must be a valid Base wallet address (0x followed by 40 characters)' }
    }
    if (!name) {
      return { success: false, error: 'Name is required' }
    }
    if (!email) {
      return { success: false, error: 'Email is required' }
    }
    if (!validateEmail(email)) {
      return { success: false, error: 'Invalid email format' }
    }
    if (!agreed) {
      return { success: false, error: 'You must agree to the terms' }
    }
    if (!recaptchaToken) {
      return { success: false, error: 'Captcha verification required' }
    }
    const isValidToken = await verifyRecaptchaToken(recaptchaToken)
    if (!isValidToken) {
      return { success: false, error: 'Captcha verification failed. Please try again.' }
    }

    // Submit to Google Sheets
    const submissionData: RewardsFormData = {
      domainId,
      description,
      city: city || undefined,
      walletAddress,
      name,
      email,
      discord: discord || undefined,
      twitter: twitter || undefined,
      ipHash,
    }

    await appendRewardsSubmission(submissionData)

    return { success: true }
  } catch (error) {
    console.error(`[${new Date().toISOString()}] Error submitting rewards form:`, error)
    return {
      success: false,
      error: 'An error occurred while submitting the form. Please try again.',
    }
  }
}
