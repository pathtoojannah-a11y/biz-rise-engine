export const TRADE_OPTIONS = [
  "General Contractor",
  "HVAC",
  "Plumbing",
  "Electrical",
  "Roofing",
  "Landscaping",
  "Painting",
  "Cleaning",
  "Other",
] as const;

export const TIMEZONE_OPTIONS = [
  "America/New_York",
  "America/Chicago",
  "America/Denver",
  "America/Los_Angeles",
  "America/Phoenix",
] as const;

const PIPELINE_TEMPLATES: Record<string, string[]> = {
  "General Contractor": ["New Lead", "Contacted", "Estimate Scheduled", "Proposal Sent", "Booked", "Completed"],
  HVAC: ["New Lead", "Contacted", "Diagnosis Scheduled", "Estimate Sent", "Booked", "Job Complete"],
  Plumbing: ["New Lead", "Contacted", "Dispatch Scheduled", "Estimate Sent", "Booked", "Job Complete"],
  Electrical: ["New Lead", "Contacted", "Site Visit Scheduled", "Quote Sent", "Booked", "Job Complete"],
  Roofing: ["New Lead", "Contacted", "Inspection Scheduled", "Estimate Sent", "Contract Signed", "Project Complete"],
  Landscaping: ["New Lead", "Contacted", "Walkthrough Scheduled", "Proposal Sent", "Booked", "Completed"],
  Painting: ["New Lead", "Contacted", "Walkthrough Scheduled", "Quote Sent", "Booked", "Completed"],
  Cleaning: ["New Lead", "Contacted", "Walkthrough Scheduled", "Quote Sent", "Booked", "Completed"],
  Other: ["New Lead", "Contacted", "Qualified", "Quoted", "Booked", "Completed"],
};

export function buildPipelineStages(industry: string) {
  return PIPELINE_TEMPLATES[industry] ?? PIPELINE_TEMPLATES.Other;
}

/**
 * Rough US ZIP prefix → timezone mapping.
 * Covers the lower 48 + AK/HI by first 3 digits of ZIP.
 * Not perfect for every edge case, but good enough for auto-suggesting.
 */
const MOUNTAIN_PREFIXES = new Set([
  "590","591","592","593","594","595","596","597","598","599", // MT
  "820","821","822","823","824","825","826","827","828","829","830","831", // WY
  "800","801","802","803","804","805","806","807","808","809","810","811","812","813","814","815","816", // CO
  "870","871","872","873","874","875","876","877","878","879","880","881","882","883","884", // NM
  "840","841","842","843","844","845","846","847", // UT
  "832","833","834","835","836","837","838", // ID
]);

const PACIFIC_PREFIXES = new Set([
  "900","901","902","903","904","905","906","907","908","909","910","911","912","913","914","915","916","917","918","919",
  "920","921","922","923","924","925","926","927","928","929","930","931","932","933","934","935","936","937","938","939",
  "940","941","942","943","944","945","946","947","948","949","950","951","952","953","954","955","956","957","958","959",
  "960","961", // CA
  "970","971","972","973","974","975","976","977","978","979", // OR
  "980","981","982","983","984","985","986","987","988","989","990","991","992","993","994", // WA
]);

const CENTRAL_PREFIXES = new Set([
  "350","351","352","353","354","355","356","357","358","359","360","361","362","363","364","365","366","367","368","369", // AL
  "370","371","372","373","374","375","376","377","378","379","380","381","382","383","384","385", // TN (central)
  "386","387","388","389","390","391","392","393","394","395","396","397", // MS
  "700","701","702","703","704","705","706","707","708","709","710","711","712","713","714", // LA
  "716","717","718","719","720","721","722","723","724","725","726","727","728","729", // AR
  "730","731","732","733","734","735","736","737","738","739","740","741","742","743","744","745","746","747","748","749", // OK
  "750","751","752","753","754","755","756","757","758","759","760","761","762","763","764","765","766","767","768","769","770","771","772","773","774","775","776","777","778","779","780","781","782","783","784","785","786","787","788","789","790","791","792","793","794","795","796","797","798","799", // TX
  "500","501","502","503","504","505","506","507","508","509","510","511","512","513","514","515","516","517","518","519","520","521","522","523","524","525","526","527","528", // IA
  "530","531","532","533","534","535","536","537","538","539","540","541","542","543","544","545","546","547","548","549", // WI
  "550","551","552","553","554","555","556","557","558","559","560","561","562","563","564","565","566","567", // MN
  "570","571","572","573","574","575","576","577", // SD
  "580","581","582","583","584","585","586","587","588", // ND
  "600","601","602","603","604","605","606","607","608","609","610","611","612","613","614","615","616","617","618","619","620","621","622","623","624","625","626","627","628","629", // IL
  "630","631","632","633","634","635","636","637","638","639","640","641","642","643","644","645","646","647","648","649","650","651","652","653","654","655","656","657","658","659","660","661","662","663","664","665","666","667","668","669","670","671","672","673","674","675","676","677","678","679", // MO
  "680","681","682","683","684","685","686","687","688","689","690","691","692","693", // NE
  "660","661","662","663","664","665","666","667","668","669","670","671","672","673","674","675","676","677","678","679", // KS
]);

const PHOENIX_PREFIXES = new Set([
  "850","851","852","853","854","855","856","857","858","859","860","861","862","863","864","865", // AZ
]);

export function timezoneFromZip(zip: string): string | null {
  const digits = zip.replace(/\D/g, "");
  if (digits.length !== 5) return null;
  const prefix = digits.slice(0, 3);

  if (PACIFIC_PREFIXES.has(prefix)) return "America/Los_Angeles";
  if (PHOENIX_PREFIXES.has(prefix)) return "America/Phoenix";
  if (MOUNTAIN_PREFIXES.has(prefix)) return "America/Denver";
  if (CENTRAL_PREFIXES.has(prefix)) return "America/Chicago";
  // Default to Eastern for everything else (East Coast, Southeast, Northeast)
  return "America/New_York";
}

export function formatTimezoneLabel(timezone: string) {
  const [, city = timezone] = timezone.split("/");
  return city.replace(/_/g, " ");
}

export function getDetectedTimezone() {
  const detectedTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  return TIMEZONE_OPTIONS.includes(detectedTimezone as (typeof TIMEZONE_OPTIONS)[number])
    ? detectedTimezone
    : "America/New_York";
}

export function getBusinessNameSuggestion(fullName: string | null | undefined, email: string | null | undefined) {
  if (fullName?.trim()) {
    return `${fullName.trim()}'s Business`;
  }

  if (email?.includes("@")) {
    const [domain] = email.split("@")[1].split(".");
    return domain.replace(/[-_]/g, " ").replace(/\b\w/g, (char) => char.toUpperCase());
  }

  return "";
}
