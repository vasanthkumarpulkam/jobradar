import { NextResponse } from "next/server";

export const runtime = "edge";
export const maxDuration = 30;

// ── TARGET KEYWORDS ──────────────────────────────────────────────────────────
const KEYWORDS = [
  "data analyst","business analyst","power bi","bi developer",
  "business intelligence","financial analyst","data engineer",
  "business operations analyst","etl developer","analytics engineer",
  "sr. analyst","senior analyst","compliance analyst","reporting analyst",
  "bi analyst","tableau developer","sql analyst","data steward",
  "data infrastructure","senior data analyst",
];

function isRelevant(title = "") {
  const t = title.toLowerCase();
  return KEYWORDS.some(k => t.includes(k));
}

function isWithin30Min(dateVal: string | number | null) {
  if (!dateVal) return false;
  const ms = typeof dateVal === "number" ? dateVal : new Date(dateVal).getTime();
  return (Date.now() - ms) <= 30 * 60 * 1000;
}

// ── COMPANY LISTS ─────────────────────────────────────────────────────────────

const GREENHOUSE_SLUGS = [
  "stripe","airbnb","discord","figma","notion","robinhood","brex",
  "gusto","lattice","airtable","asana","benchling","chime","doordash",
  "duolingo","flexport","gitlab","hubspot","instacart","intercom",
  "nerdwallet","okta","pagerduty","patreon","paylocity","plaid",
  "procore","ramp","reddit","retool","roblox","rubrik","samsara",
  "sentry","shopify","squarespace","toast","twilio","udemy","vanta",
  "webflow","zapier","zendesk","zscaler","anthropic","scale-ai",
  "servicenow","visa","mastercard","capital-one","crowdstrike","tenable",
  "accenture","booz-allen","lockheed-martin","leidos","att","amazon",
  "walmart","target","southwest-airlines","marriott","toyota","tesla",
  "abbvie","pfizer","merck","johnson-and-johnson","unitedhealth",
  "mcafee","palo-alto-networks","fortinet","tableau","thoughtspot",
  "domo","qlik","microstrategy","mongodb","elastic","datadog","splunk",
  "snowflake","databricks","dbt-labs","fivetran","airbyte","collibra",
  "informatica","matillion","talend","census","hightouch","amplitude",
  "mixpanel","segment","heap","fullstory","pendo","intercom",
  "meriton","northpointtechnology","madisonenergyinfrastructure",
];

const LEVER_SLUGS = [
  "netflix","coinbase","lyft","gusto","carta","faire","lattice",
  "brex","scale-ai","anduril","applied-intuition","ro","cityblock",
  "openai","cohere","figma","notion","linear","loom","miro","coda",
  "deel","remote","amplitude","mixpanel","segment","heap","fullstory",
  "datadog","newrelic","splunk","elastic","dbt-labs","fivetran",
  "airbyte","astronomer","prefect","starburst","metabase","mode",
  "sigma","collibra","alation","census","hightouch","rudderstack",
  "snowflake","databricks","dremio","hashicorp","circleci","github",
  "chime","current","mercury","ramp","divvy","expensify","brex",
  "verkada","samsara","axon","palantir","instabase","uipath",
  "outreach","salesloft","gong","chorus","clari","hubspot","zendesk",
  "twilio","stripe","adyen","marqeta","affirm","plaid","emburse",
  "businesswire","intrafi","seranbio","fehrandpeers","goodleap",
];

const ASHBY_SLUGS = [
  "linear","vercel","ramp","mercury","clerk","resend","cal",
  "liveblocks","trigger","railway","neon","planetscale","supabase",
  "convex","cursor","codeium","sourcegraph","perplexity","mistral",
  "together","replicate","modal","weights-biases","dbt-labs","evidence",
  "cube","lightdash","metabase","hex","deepnote","retool","appsmith",
  "temporal","prefect","dagster","mage","airbyte","fivetran","hevo",
  "amplitude","june","mixpanel","posthog","heap","anomalo",
  "monte-carlo","acceldata","collibra","alation","atlan",
  "hightouch","census","rudderstack","segment","mparticle",
  "secoda","informatica","talend","matillion","snaplogic","boomi",
  "crusoe","suno","centerfield","skydio","blossom-health","creditgenie",
];

// Key Workday companies for analyst/data roles
const WORKDAY_COMPANIES = [
  { slug: "guidehouse",     tenant: "external",        name: "Guidehouse" },
  { slug: "att",            tenant: "ATTCareers",       name: "AT&T" },
  { slug: "dallascityhall", tenant: "codcareers",       name: "City of Dallas" },
  { slug: "toyota",         tenant: "TMNA",             name: "Toyota" },
  { slug: "southwest",      tenant: "SWA_External",     name: "Southwest Airlines" },
  { slug: "fidelity",       tenant: "fidelitycareers",  name: "Fidelity" },
  { slug: "capitalone",     tenant: "Capital_One",       name: "Capital One" },
  { slug: "usaa",           tenant: "usaajobsearch",    name: "USAA" },
  { slug: "visa",           tenant: "visacareers",      name: "Visa" },
  { slug: "citi",           tenant: "citi",             name: "Citi" },
  { slug: "abbvie",         tenant: "abbvie_ext",        name: "AbbVie" },
  { slug: "mcafee",         tenant: "external",          name: "McAfee" },
  { slug: "accenture",      tenant: "accenturecareer",  name: "Accenture" },
  { slug: "deloitte",       tenant: "deloitte",         name: "Deloitte" },
  { slug: "forcepoint",     tenant: "external-careers", name: "Forcepoint" },
  { slug: "dxctechnology",  tenant: "dxcjobs",          name: "DXC Technology" },
  { slug: "corebridgefinancial", tenant: "corebridgefinancial", name: "Corebridge" },
  { slug: "santander",      tenant: "santandercareers", name: "Santander" },
  { slug: "sanofi",         tenant: "sanoficareers",    name: "Sanofi" },
  { slug: "scj",            tenant: "external_career_site", name: "SC Johnson" },
  { slug: "americanredcross", tenant: "american_red_cross_careers", name: "Red Cross" },
  { slug: "granite",        tenant: "careers",          name: "Granite Construction" },
  { slug: "nc",             tenant: "nc_careers",       name: "State of NC" },
  { slug: "swa",            tenant: "external",         name: "Southwest Airlines" },
  { slug: "autonation",     tenant: "careers",          name: "AutoNation" },
  { slug: "ultra",          tenant: "ultra-careers",    name: "Ultra Electronics" },
  { slug: "relx",           tenant: "relx",             name: "RELX" },
  { slug: "maine",          tenant: "executive",        name: "State of Maine" },
  { slug: "myhrabc",        tenant: "Global",           name: "Cencora" },
  { slug: "nationsbenefits",tenant: "external",         name: "NationsBenefits" },
];

// ── FETCHERS ──────────────────────────────────────────────────────────────────

interface Job {
  id: string;
  title: string;
  company: string;
  location: string;
  url: string;
  posted: string;
  source: string;
  remote: boolean;
}

async function fetchGreenhouse(slug: string): Promise<Job[]> {
  try {
    const r = await fetch(
      `https://boards-api.greenhouse.io/v1/boards/${slug}/jobs?content=false`,
      { signal: AbortSignal.timeout(6000) }
    );
    if (!r.ok) return [];
    const data = await r.json() as { jobs: Array<{id:number;title:string;location:{name:string};updated_at:string;absolute_url:string}> };
    return (data.jobs || [])
      .filter(j => isRelevant(j.title) && isWithin30Min(j.updated_at))
      .map(j => ({
        id: `gh-${j.id}`,
        title: j.title,
        company: slug.replace(/-/g," ").replace(/\b\w/g,c=>c.toUpperCase()),
        location: j.location?.name || "United States",
        url: j.absolute_url,
        posted: j.updated_at,
        source: "greenhouse",
        remote: (j.location?.name||"").toLowerCase().includes("remote"),
      }));
  } catch { return []; }
}

async function fetchLever(slug: string): Promise<Job[]> {
  try {
    const r = await fetch(
      `https://api.lever.co/v0/postings/${slug}?mode=json&limit=100`,
      { signal: AbortSignal.timeout(6000) }
    );
    if (!r.ok) return [];
    const data = await r.json() as Array<{id:string;text:string;categories:{location:string};createdAt:number;hostedUrl:string;workplaceType:string}>;
    const jobs = Array.isArray(data) ? data : [];
    return jobs
      .filter(j => isRelevant(j.text) && isWithin30Min(j.createdAt))
      .map(j => ({
        id: `lv-${j.id}`,
        title: j.text,
        company: slug.replace(/-/g," ").replace(/\b\w/g,c=>c.toUpperCase()),
        location: j.categories?.location || "United States",
        url: j.hostedUrl,
        posted: new Date(j.createdAt).toISOString(),
        source: "lever",
        remote: (j.workplaceType||"").toLowerCase().includes("remote") ||
                (j.categories?.location||"").toLowerCase().includes("remote"),
      }));
  } catch { return []; }
}

async function fetchAshby(slug: string): Promise<Job[]> {
  try {
    const r = await fetch(
      `https://api.ashbyhq.com/posting-public/job-board/${slug}`,
      { signal: AbortSignal.timeout(6000) }
    );
    if (!r.ok) return [];
    const data = await r.json() as { jobPostings: Array<{id:string;title:string;locationName:string;publishedDate:string;jobUrl:string;isRemote:boolean}> };
    return (data.jobPostings || [])
      .filter(j => isRelevant(j.title) && isWithin30Min(j.publishedDate))
      .map(j => ({
        id: `ab-${j.id}`,
        title: j.title,
        company: slug.replace(/-/g," ").replace(/\b\w/g,c=>c.toUpperCase()),
        location: j.locationName || "United States",
        url: j.jobUrl,
        posted: j.publishedDate,
        source: "ashby",
        remote: !!j.isRemote || (j.locationName||"").toLowerCase().includes("remote"),
      }));
  } catch { return []; }
}

async function fetchWorkday(slug: string, tenant: string, companyName: string): Promise<Job[]> {
  try {
    const url = `https://${slug}.wd1.myworkdayjobs.com/wday/cxs/${slug}/${tenant}/jobs`;
    const r = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ appliedFacets: {}, limit: 20, offset: 0, searchText: "analyst" }),
      signal: AbortSignal.timeout(8000),
    });
    if (!r.ok) return [];
    const data = await r.json() as { jobPostings: Array<{title:string;locationsText:string;postedOn:string;externalPath:string;bulletFields:string[]}> };
    return (data.jobPostings || [])
      .filter(j => isRelevant(j.title) && isWithin30Min(j.postedOn))
      .map((j, i) => ({
        id: `wd-${slug}-${i}`,
        title: j.title,
        company: companyName,
        location: j.locationsText || "United States",
        url: `https://${slug}.wd1.myworkdayjobs.com/${tenant}${j.externalPath}`,
        posted: j.postedOn,
        source: "workday",
        remote: (j.locationsText||"").toLowerCase().includes("remote"),
      }));
  } catch { return []; }
}

// ── MAIN HANDLER ──────────────────────────────────────────────────────────────

export async function GET() {
  const allPromises: Promise<Job[]>[] = [
    ...GREENHOUSE_SLUGS.map(s => fetchGreenhouse(s)),
    ...LEVER_SLUGS.map(s => fetchLever(s)),
    ...ASHBY_SLUGS.map(s => fetchAshby(s)),
    ...WORKDAY_COMPANIES.map(c => fetchWorkday(c.slug, c.tenant, c.name)),
  ];

  const results = await Promise.allSettled(allPromises);
  const jobs: Job[] = [];

  results.forEach(r => {
    if (r.status === "fulfilled") jobs.push(...r.value);
  });

  // Deduplicate by URL
  const seen = new Set<string>();
  const unique = jobs.filter(j => {
    if (!j.url || seen.has(j.url)) return false;
    seen.add(j.url);
    return true;
  }).sort((a, b) => new Date(b.posted).getTime() - new Date(a.posted).getTime());

  return NextResponse.json({
    jobs: unique,
    meta: {
      total: unique.length,
      scanned: allPromises.length,
      timestamp: new Date().toISOString(),
      lookback_mins: 30,
      sources: {
        greenhouse: unique.filter(j=>j.source==="greenhouse").length,
        lever: unique.filter(j=>j.source==="lever").length,
        ashby: unique.filter(j=>j.source==="ashby").length,
        workday: unique.filter(j=>j.source==="workday").length,
      }
    }
  }, {
    headers: {
      "Cache-Control": "no-store",
      "Access-Control-Allow-Origin": "*",
    }
  });
}
