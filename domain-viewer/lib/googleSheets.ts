import { GoogleSpreadsheet } from 'google-spreadsheet'
import { JWT } from 'google-auth-library'

export interface RewardsFormData {
  domainId: string
  description: string
  city?: string
  walletAddress: string
  name: string
  email: string
  discord?: string
  twitter?: string
  ipHash: string
}

let cachedDoc: GoogleSpreadsheet | null = null

async function getSpreadsheet(): Promise<GoogleSpreadsheet> {
  if (cachedDoc) {
    return cachedDoc
  }

  const spreadsheetId = process.env.GOOGLE_SHEETS_SPREADSHEET_ID
  const clientEmail = process.env.GOOGLE_SHEETS_CLIENT_EMAIL
  const privateKey = process.env.GOOGLE_SHEETS_PRIVATE_KEY

  console.log('[GoogleSheets] Checking credentials...')
  console.log('[GoogleSheets] Spreadsheet ID:', spreadsheetId ? 'set' : 'missing')
  console.log('[GoogleSheets] Client Email:', clientEmail ? clientEmail : 'missing')
  console.log('[GoogleSheets] Private Key:', privateKey ? 'set (length: ' + privateKey.length + ')' : 'missing')

  if (!spreadsheetId || !clientEmail || !privateKey) {
    throw new Error('Google Sheets credentials not configured')
  }

  try {
    const serviceAccountAuth = new JWT({
      email: clientEmail,
      key: privateKey.replace(/\\n/g, '\n'),
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    })

    console.log('[GoogleSheets] JWT created, loading spreadsheet...')
    const doc = new GoogleSpreadsheet(spreadsheetId, serviceAccountAuth)
    await doc.loadInfo()
    console.log('[GoogleSheets] Spreadsheet loaded:', doc.title)

    cachedDoc = doc
    return doc
  } catch (error) {
    console.error('[GoogleSheets] Failed to connect:', error)
    throw error
  }
}

export async function appendRewardsSubmission(data: RewardsFormData): Promise<void> {
  const doc = await getSpreadsheet()

  // Get the first sheet or create one if it doesn't exist
  let sheet = doc.sheetsByIndex[0]

  if (!sheet) {
    sheet = await doc.addSheet({
      title: 'Rewards Submissions',
      headerValues: [
        'Timestamp',
        'Domain ID',
        'Description',
        'City',
        'Wallet Address',
        'Name',
        'Email',
        'Discord',
        'X (Twitter)',
        'IP Hash',
      ],
    })
  }

  // Ensure headers exist
  await sheet.loadHeaderRow().catch(async () => {
    await sheet.setHeaderRow([
      'Timestamp',
      'Domain ID',
      'Description',
      'City',
      'Wallet Address',
      'Name',
      'Email',
      'Discord',
      'X (Twitter)',
      'IP Hash',
    ])
  })

  await sheet.addRow({
    'Timestamp': new Date().toISOString(),
    'Domain ID': data.domainId,
    'Description': data.description,
    'City': data.city || '',
    'Wallet Address': data.walletAddress,
    'Name': data.name,
    'Email': data.email,
    'Discord': data.discord || '',
    'X (Twitter)': data.twitter || '',
    'IP Hash': data.ipHash,
  })
}
