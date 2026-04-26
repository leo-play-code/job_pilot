export interface Job104SearchParams {
  keyword: string
  area?: string       // comma-separated area codes
  jobcat?: string     // job category codes
  indcat?: string     // industry category codes
  s9?: string         // salary range code
  order?: string      // sort: '14' = by date
  page?: number
  rows?: number       // max 20
}

export interface Job104ListingRaw {
  jobNo: string
  jobName: string
  custName: string
  jobAddrNoDesc: string
  salaryDesc: string
  description: string
  tags: { name: string }[]
  link: { job: string }
  appearDate: string
}

export interface Job104SearchResponse {
  data: {
    list: Job104ListingRaw[]
    totalPage: number
    totalCount: number
  }
}

export const TAIWAN_AREA_CODES: Record<string, string> = {
  台北市: '6001001000',
  新北市: '6001002000',
  基隆市: '6001003000',
  桃園市: '6001005000',
  新竹市: '6001007000',
  新竹縣: '6001006000',
  苗栗縣: '6001015000',
  台中市: '6001008000',
  彰化縣: '6001009000',
  南投縣: '6001010000',
  雲林縣: '6001011000',
  嘉義市: '6001012000',
  嘉義縣: '6001013000',
  台南市: '6001014000',
  高雄市: '6001016000',
  屏東縣: '6001017000',
  宜蘭縣: '6001004000',
  花蓮縣: '6001018000',
  台東縣: '6001019000',
}

// 104 salary range codes
export const SALARY_CODES: Record<string, string> = {
  '30000': '1',
  '35000': '2',
  '40000': '10',
  '45000': '4',
  '50000': '5',
  '55000': '6',
  '60000': '7',
}

const BASE_URL = 'https://www.104.com.tw/jobs/search/list'
const SEARCH_HEADERS = {
  'Referer': 'https://www.104.com.tw/',
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Accept': 'application/json, text/plain, */*',
  'Accept-Language': 'zh-TW,zh;q=0.9',
  'X-Requested-With': 'XMLHttpRequest',
}

export async function search104Jobs(params: Job104SearchParams): Promise<Job104SearchResponse> {
  const url = new URL(BASE_URL)
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== '') url.searchParams.set(k, String(v))
  })
  url.searchParams.set('jobsource', '2018indexpoc')
  url.searchParams.set('mode', 's')
  if (!params.order) url.searchParams.set('order', '14')
  if (!params.rows) url.searchParams.set('rows', '20')

  const res = await fetch(url.toString(), {
    headers: SEARCH_HEADERS,
    cache: 'no-store',
  })

  if (!res.ok) {
    throw new Error(`104 search API returned ${res.status}`)
  }

  const contentType = res.headers.get('content-type') ?? ''
  if (!contentType.includes('application/json')) {
    const preview = (await res.text()).slice(0, 300)
    throw new Error(`104 search API returned non-JSON (${res.status}): ${preview}`)
  }

  return res.json() as Promise<Job104SearchResponse>
}

export function mapJob104ToListing(raw: Job104ListingRaw) {
  return {
    jobId: raw.jobNo,
    platform: 'JOB_104' as const,
    title: raw.jobName ?? '',
    company: raw.custName ?? '',
    location: raw.jobAddrNoDesc ?? '',
    salaryDesc: raw.salaryDesc ?? null,
    description: raw.description ?? '',
    tags: raw.tags?.map((t) => t.name) ?? [],
    applyUrl: raw.link?.job
      ? `https://www.104.com.tw${raw.link.job}`
      : `https://www.104.com.tw/job/${raw.jobNo}`,
  }
}
