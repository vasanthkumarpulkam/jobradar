import { NextResponse } from "next/server";

export const runtime = "edge";
export const maxDuration = 45;

const KEYWORDS = [
  "data analyst","business analyst","power bi","bi developer",
  "business intelligence","financial analyst","data engineer",
  "business operations analyst","etl developer","analytics engineer",
  "sr. analyst","senior analyst","compliance analyst","reporting analyst",
  "bi analyst","tableau developer","sql analyst","data steward",
  "data infrastructure","senior data analyst","operations analyst",
];

const US_STATES = ["Alabama","Alaska","Arizona","Arkansas","California","Colorado",
  "Connecticut","Delaware","Florida","Georgia","Hawaii","Idaho","Illinois","Indiana",
  "Iowa","Kansas","Kentucky","Louisiana","Maine","Maryland","Massachusetts","Michigan",
  "Minnesota","Mississippi","Missouri","Montana","Nebraska","Nevada","New Hampshire",
  "New Jersey","New Mexico","New York","North Carolina","North Dakota","Ohio","Oklahoma",
  "Oregon","Pennsylvania","Rhode Island","South Carolina","South Dakota","Tennessee",
  "Texas","Utah","Vermont","Virginia","Washington","West Virginia","Wisconsin","Wyoming",
  "DC","District of Columbia"];

const US_CITIES = ["new york","los angeles","chicago","houston","phoenix","philadelphia",
  "san antonio","san diego","dallas","san jose","austin","jacksonville","fort worth",
  "columbus","charlotte","indianapolis","san francisco","seattle","denver","boston",
  "nashville","memphis","portland","las vegas","louisville","baltimore","milwaukee",
  "albuquerque","tucson","fresno","sacramento","mesa","kansas city","atlanta","omaha",
  "colorado springs","raleigh","long beach","virginia beach","minneapolis","tampa",
  "new orleans","arlington","wichita","bakersfield","aurora","anaheim","plano","corpus",
  "lexington","riverside","stockton","pittsburgh","anchorage","cincinnati","greensboro",
  "cleveland","lincoln","orlando","st. louis","irvine","newark","durham","chula vista"];

function isRelevant(title = "") {
  const t = title.toLowerCase();
  return KEYWORDS.some(k => t.includes(k));
}

function isUS(location = "") {
  if (!location) return true; // include if no location info
  const l = location.toLowerCase();
  if (l.includes("remote") || l.includes("united states") || l.includes(", us") || l.includes(", usa")) return true;
  if (US_CITIES.some(c => l.includes(c))) return true;
  if (US_STATES.some(s => l.toLowerCase().includes(s.toLowerCase()))) return true;
  // Exclude obviously non-US
  const nonUS = ["china","india","uk","london","canada","australia","germany","france",
    "singapore","brazil","mexico","japan","korea","netherlands","spain","italy","poland",
    "ireland","israel","sweden","denmark","switzerland","austria","belgium","norway"];
  if (nonUS.some(c => l.includes(c))) return false;
  return true; // default include if unsure
}

function isWithin(dateVal: string | number | null, minutes: number) {
  if (!dateVal) return false;
  const ms = typeof dateVal === "number" ? dateVal : new Date(dateVal).getTime();
  if (isNaN(ms)) return false;
  return (Date.now() - ms) <= minutes * 60 * 1000;
}

interface Job {
  id: string; title: string; company: string;
  location: string; url: string; posted: string;
  source: string; remote: boolean;
}

// ── GREENHOUSE ────────────────────────────────────────────────────────────────
const GH_SLUGS = [
  "stripe","airbnb","discord","figma","notion","robinhood","brex","gusto","lattice",
  "airtable","asana","benchling","chime","doordash","duolingo","flexport","gitlab",
  "hubspot","instacart","intercom","nerdwallet","okta","pagerduty","patreon","paylocity",
  "plaid","procore","ramp","reddit","retool","roblox","rubrik","samsara","sentry",
  "shopify","squarespace","toast","twilio","udemy","vanta","webflow","zapier","zendesk",
  "zscaler","anthropic","scale-ai","servicenow","visa","mastercard","capital-one",
  "crowdstrike","tenable","accenture","booz-allen","lockheed-martin","leidos",
  "mongodb","elastic","datadog","splunk","snowflake","databricks","dbt-labs","fivetran",
  "airbyte","collibra","informatica","matillion","census","hightouch","amplitude",
  "mixpanel","segment","heap","fullstory","pendo","tableau","thoughtspot","domo",
  "qlik","microstrategy","meriton","northpointtechnology","madisonenergyinfrastructure",
  "corebridgefinancial","tenstorrent","reltio","lusternational","kodiak","planet",
  "bridgebio","amaehealth","emergentlabsinc","stratolaunch","machinalabs",
  "divergent","altium","centerfield","skydio","pokemon","rockstargames",
  "education","clockworksystems","seranbio","fehrandpeers",
];

// ── LEVER ─────────────────────────────────────────────────────────────────────
const LV_SLUGS = [
  "netflix","coinbase","lyft","gusto","carta","faire","lattice","brex","scale-ai",
  "anduril","applied-intuition","ro","cityblock","openai","cohere","figma","notion",
  "linear","loom","miro","coda","deel","remote","amplitude","mixpanel","segment",
  "heap","fullstory","datadog","newrelic","splunk","elastic","dbt-labs","fivetran",
  "airbyte","astronomer","prefect","starburst","metabase","mode","sigma","collibra",
  "alation","census","hightouch","rudderstack","snowflake","databricks","dremio",
  "hashicorp","circleci","github","chime","current","mercury","ramp","divvy",
  "expensify","verkada","samsara","axon","palantir","instabase","uipath",
  "outreach","salesloft","gong","chorus","clari","hubspot","zendesk","twilio",
  "stripe","adyen","marqeta","affirm","plaid","emburse","businesswire","intrafi",
  "fehrandpeers","goodleap","sideinc","seranbio",
];

// ── ASHBY ─────────────────────────────────────────────────────────────────────
const AB_SLUGS = [
  "linear","vercel","ramp","mercury","clerk","resend","cal","liveblocks","trigger",
  "railway","neon","planetscale","supabase","convex","cursor","codeium","sourcegraph",
  "perplexity","mistral","together","replicate","modal","weights-biases","dbt-labs",
  "evidence","cube","lightdash","metabase","hex","deepnote","retool","appsmith",
  "temporal","prefect","dagster","mage","airbyte","fivetran","hevo","amplitude",
  "june","mixpanel","posthog","heap","anomalo","monte-carlo","acceldata","collibra",
  "alation","atlan","hightouch","census","rudderstack","segment","mparticle",
  "secoda","informatica","talend","matillion","snaplogic","boomi","crusoe","suno",
  "centerfield","skydio","blossom-health","creditgenie","triumph-arcade",
];

// ── WORKDAY — search multiple terms ──────────────────────────────────────────
const WD_COMPANIES = [
  { slug:"guidehouse",    tenant:"external",                name:"Guidehouse" },
  { slug:"att",           tenant:"ATTCareers",              name:"AT&T" },
  { slug:"dallascityhall",tenant:"codcareers",              name:"City of Dallas" },
  { slug:"toyota",        tenant:"TMNA",                    name:"Toyota" },
  { slug:"swa",           tenant:"external",                name:"Southwest Airlines" },
  { slug:"fmr",           tenant:"fidelitycareers",         name:"Fidelity" },
  { slug:"capitalone",    tenant:"Capital_One",             name:"Capital One" },
  { slug:"usaa",          tenant:"usaajobsearch",           name:"USAA" },
  { slug:"visa",          tenant:"visacareers",             name:"Visa" },
  { slug:"abbvie",        tenant:"abbvie_ext",              name:"AbbVie" },
  { slug:"mcafee",        tenant:"external",                name:"McAfee" },
  { slug:"accenture",     tenant:"accenturecareer",         name:"Accenture" },
  { slug:"deloitte",      tenant:"deloitte",                name:"Deloitte" },
  { slug:"forcepoint",    tenant:"external-careers",        name:"Forcepoint" },
  { slug:"dxctechnology", tenant:"dxcjobs",                 name:"DXC Technology" },
  { slug:"santander",     tenant:"santandercareers",        name:"Santander" },
  { slug:"sanofi",        tenant:"sanoficareers",           name:"Sanofi" },
  { slug:"scj",           tenant:"external_career_site",    name:"SC Johnson" },
  { slug:"americanredcross",tenant:"american_red_cross_careers",name:"Red Cross" },
  { slug:"granite",       tenant:"careers",                 name:"Granite Construction" },
  { slug:"nc",            tenant:"nc_careers",              name:"State of NC" },
  { slug:"autonation",    tenant:"careers",                 name:"AutoNation" },
  { slug:"relx",          tenant:"relx",                    name:"RELX" },
  { slug:"myhrabc",       tenant:"Global",                  name:"Cencora" },
  { slug:"cranecompany",  tenant:"Careers",                 name:"Crane Company" },
  { slug:"amat",          tenant:"external",                name:"Applied Materials" },
];

const WD_SEARCH_TERMS = ["analyst","data","business intelligence","power bi","ETL"];

// ── Fetchers ──────────────────────────────────────────────────────────────────

async function fetchGreenhouse(slug: string): Promise<Job[]> {
  try {
    const r = await fetch(
      `https://boards-api.greenhouse.io/v1/boards/${slug}/jobs?content=false`,
      { signal: AbortSignal.timeout(8000) }
    );
    if (!r.ok) return [];
    const data = await r.json() as { jobs: Array<{id:number;title:string;location:{name:string};updated_at:string;absolute_url:string}> };
    return (data.jobs || [])
      .filter(j => isRelevant(j.title) && isUS(j.location?.name) && isWithin(j.updated_at, 30))
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
      { signal: AbortSignal.timeout(8000) }
    );
    if (!r.ok) return [];
    const data = await r.json() as Array<{id:string;text:string;categories:{location:string;team:string};createdAt:number;hostedUrl:string;workplaceType:string}>;
    const jobs = Array.isArray(data) ? data : [];
    return jobs
      .filter(j => isRelevant(j.text) && isUS(j.categories?.location) && isWithin(j.createdAt, 30))
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
      { signal: AbortSignal.timeout(8000) }
    );
    if (!r.ok) return [];
    const data = await r.json() as { jobPostings: Array<{id:string;title:string;locationName:string;publishedDate:string;jobUrl:string;isRemote:boolean;employmentType:string}> };
    return (data.jobPostings || [])
      .filter(j => isRelevant(j.title) && isUS(j.locationName) && isWithin(j.publishedDate, 30))
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

async function fetchWorkday(slug: string, tenant: string, name: string, term: string): Promise<Job[]> {
  try {
    const url = `https://${slug}.wd1.myworkdayjobs.com/wday/cxs/${slug}/${tenant}/jobs`;
    const r = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json", "Accept": "application/json" },
      body: JSON.stringify({ appliedFacets:{}, limit:20, offset:0, searchText: term }),
      signal: AbortSignal.timeout(10000),
    });
    if (!r.ok) return [];
    const data = await r.json() as { jobPostings: Array<{title:string;locationsText:string;postedOn:string;externalPath:string}> };
    return (data.jobPostings || [])
      .filter(j => isRelevant(j.title) && isUS(j.locationsText) && isWithin(j.postedOn, 30))
      .map((j, i) => ({
        id: `wd-${slug}-${term.replace(/\s/g,"")}${i}`,
        title: j.title,
        company: name,
        location: j.locationsText || "United States",
        url: `https://${slug}.wd1.myworkdayjobs.com/${tenant}${j.externalPath}`,
        posted: j.postedOn,
        source: "workday",
        remote: (j.locationsText||"").toLowerCase().includes("remote"),
      }));
  } catch { return []; }
}

// ── Main handler ──────────────────────────────────────────────────────────────
export async function GET() {
  const promises: Promise<Job[]>[] = [
    ...GH_SLUGS.map(s => fetchGreenhouse(s)),
    ...LV_SLUGS.map(s => fetchLever(s)),
    ...AB_SLUGS.map(s => fetchAshby(s)),
    ...WD_COMPANIES.flatMap(c =>
      WD_SEARCH_TERMS.map(term => fetchWorkday(c.slug, c.tenant, c.name, term))
    ),
  ];

  const results = await Promise.allSettled(promises);
  const all: Job[] = [];
  results.forEach(r => { if (r.status === "fulfilled") all.push(...r.value); });

  // Dedupe by URL
  const seen = new Set<string>();
  const unique = all.filter(j => {
    if (!j.url || seen.has(j.url)) return false;
    seen.add(j.url);
    return true;
  }).sort((a,b) => new Date(b.posted).getTime() - new Date(a.posted).getTime());

  const src = (s: string) => unique.filter(j => j.source === s).length;

  return NextResponse.json({
    jobs: unique,
    meta: {
      total: unique.length,
      scanned: GH_SLUGS.length + LV_SLUGS.length + AB_SLUGS.length + WD_COMPANIES.length,
      timestamp: new Date().toISOString(),
      lookback_mins: 30,
      sources: { greenhouse: src("greenhouse"), lever: src("lever"), ashby: src("ashby"), workday: src("workday") },
    }
  }, { headers: { "Cache-Control":"no-store", "Access-Control-Allow-Origin":"*" } });
}
