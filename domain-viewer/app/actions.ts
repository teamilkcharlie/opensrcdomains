"use server"

import PosemeshServerApi from "@/utils/posemeshServerApi"

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

