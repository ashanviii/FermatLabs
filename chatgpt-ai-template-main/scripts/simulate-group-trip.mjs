import { chromium } from '@playwright/test';
const baseUrl = process.env.FERMAT_SIMULATOR_URL || 'http://127.0.0.1:3000';
const password = process.env.FERMAT_SIMULATOR_PASSWORD || '123456';
const adminEmail = process.env.FERMAT_SIMULATOR_ADMIN_EMAIL || 'admin@gmail.com';
const memberEmail = process.env.FERMAT_SIMULATOR_MEMBER_EMAIL || 'test@gmail.com';
const headed = process.env.FERMAT_SIMULATOR_HEADED === 'true';
// Keep the repeatable collaboration flow independent of a probabilistic external
// model. Set FERMAT_SIMULATOR_GENERATE_AI=true when explicitly testing Groq too.
const generateAi = process.env.FERMAT_SIMULATOR_GENERATE_AI === 'true';
const tripName = `Fermat simulator ${new Date().toISOString().replace(/[:.]/g, '-')}`;

const addDays = (value, days) => {
  const next = new Date(value);
  next.setDate(next.getDate() + days);
  return next;
};
const iso = (value) => `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, '0')}-${String(value.getDate()).padStart(2, '0')}`;
const start = addDays(new Date(), 35);
const end = addDays(start, 3);
const startIso = iso(start);
const endIso = iso(end);

const log = (message) => console.log(`[simulator] ${message}`);

async function acceptTerms(page) {
  const email = page.getByLabel('Email');
  if (await email.isDisabled().catch(() => false)) {
    await page.evaluate((version) => localStorage.setItem('fermat.legal.accepted', version), process.env.FERMAT_LEGAL_VERSION || '2026-10-25');
    await page.reload();
  }
}

async function signOutIfNeeded(page) {
  const signOut = page.getByRole('button', { name: 'Sign out' });
  if (await signOut.isVisible().catch(() => false)) {
    await signOut.click();
    await page.getByText(/Join your friends' trip|Sign in to start planning/i).waitFor();
  }
}

async function signInOrCreate(page, email) {
  await page.goto(`${baseUrl}/plan`);
  await signOutIfNeeded(page);
  await acceptTerms(page);
  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Password').fill(password);
  await page.getByRole('button', { name: 'Sign in with email' }).click();

  const entry = page.getByRole('tab', { name: 'New trip' });
  const authError = page.getByText('Incorrect email or password.', { exact: true });
  await Promise.race([
    entry.waitFor({ state: 'visible' }),
    authError.waitFor({ state: 'visible' }),
  ]);
  if (await authError.isVisible().catch(() => false)) {
    await page.getByRole('button', { name: 'Create an account' }).click();
    await entry.waitFor({ state: 'visible' });
    log(`created ${email}`);
  } else {
    log(`signed in ${email}`);
  }
}

async function chooseDates(page) {
  await page.getByRole('button', { name: 'Choose trip dates' }).click();
  for (let attempts = 0; attempts < 14; attempts += 1) {
    const startDay = page.locator(`[data-day="${startIso}"] button`);
    if (await startDay.count()) {
      await startDay.evaluate((button) => button.click());
      await page
        .locator(`[data-day="${endIso}"] button`)
        .evaluate((button) => button.click());
      return;
    }
    await page.getByRole('button', { name: /next month/i }).click();
  }
  throw new Error(`Could not reach ${startIso} in the date picker`);
}

async function createTrip(page) {
  // Trip loading chooses the initial tab once; wait for that effect before
  // selecting New trip so the simulator also works on reused accounts.
  await page
    .getByRole('button', { name: 'Refresh trips' })
    .waitFor({ state: 'visible' });
  await page.waitForFunction(
    () => !document.querySelector('[aria-label="Refresh trips"]')?.hasAttribute('disabled'),
  );
  await page.getByRole('tab', { name: 'New trip' }).click();
  await page.getByText('Plan something together', { exact: true }).waitFor();
  await page.getByLabel('Trip name').fill(tripName);
  await page.getByRole('combobox', { name: "Where's the group based?" }).click();
  await page.getByPlaceholder('Search countries…').fill('India');
  await page.getByRole('option', { name: /India IN/ }).click();
  await chooseDates(page);
  await page.getByRole('button', { name: 'Start planning' }).click();
  await page.getByRole('heading', { name: tripName }).waitFor();
  const invite = page.locator('[title*="#invite="]').first();
  await invite.waitFor();
  const url = await invite.getAttribute('title');
  if (!url) throw new Error('Invite URL was not rendered');
  log(`created trip ${tripName}`);
  return url;
}

async function selectCity(page, city) {
  const field = page.getByPlaceholder('Search a city or town').first();
  await field.fill(city);
  await page.getByRole('button', { name: 'Search cities' }).first().click();
  const results = page.getByRole('list', { name: 'City search results' });
  await results.waitFor();
  await results.getByRole('button').first().click();
}

async function fillPrivateDetails(page, budget) {
  const addDetails = page.getByRole('button', { name: 'Add details' });
  if (await addDetails.isVisible().catch(() => false)) await addDetails.click();
  await page.getByRole('heading', { name: 'Your details' }).waitFor();
  await selectCity(page, 'Delhi');
  await page.getByLabel('Your budget').fill(String(budget));
  await page.getByRole('checkbox', { name: 'Train' }).check();
  await page.getByRole('checkbox', { name: 'Bus' }).check();
  await page.getByRole('checkbox', { name: /Allow AI trip drafts/i }).check();
  const noPassport = page.getByRole('checkbox', { name: /I don't have a passport yet/i });
  if (await noPassport.isVisible().catch(() => false)) await noPassport.check();
  await page.getByRole('group', { name: "What you're into" }).getByRole('button', { name: 'Food' }).click();
  await page.getByRole('checkbox', { name: /These dates work for me/i }).check();
  await page.getByRole('button', { name: 'Save my details' }).click();
  await page.getByText('Your private budget', { exact: true }).waitFor();
}

async function joinTrip(page, inviteUrl) {
  // A hash-only navigation on the already-open /plan document does not remount
  // the planner, whose invite parser intentionally runs once on mount.
  await page.goto('about:blank');
  await page.goto(inviteUrl);
  await page.getByLabel('Your name in the group').fill('Simulator member');
  await page.getByRole('button', { name: 'Ask to join' }).click();
  await page.getByText('Request sent', { exact: true }).waitFor();
}

async function generateDestination(page) {
  const heading = page.getByRole('heading', { name: 'Search destination' });
  await heading.waitFor({ timeout: 20_000 });
  const fields = page.getByPlaceholder('Search a city or town');
  const destination = fields.last();
  await destination.fill('Goa');
  const searchButtons = page.getByRole('button', { name: 'Search cities' });
  await searchButtons.last().click();
  const resultLists = page.getByRole('list', { name: 'City search results' });
  await resultLists.last().getByRole('button').first().click();
  await page.getByRole('button', { name: 'Generate draft' }).click();
  await page.getByText('Draft preview', { exact: true }).waitFor({ timeout: 45_000 });
  log('Groq destination draft generated successfully');
}

const browser = await chromium.launch({ headless: !headed });
const adminContext = await browser.newContext();
const memberContext = await browser.newContext();
const admin = await adminContext.newPage();
const member = await memberContext.newPage();

try {
  await signInOrCreate(admin, adminEmail);
  const inviteUrl = await createTrip(admin);
  await fillPrivateDetails(admin, 35000);

  await signInOrCreate(member, memberEmail);
  await joinTrip(member, inviteUrl);

  await admin.reload();
  await admin.getByRole('button', { name: 'Let in' }).click();
  await admin.getByText('2 of 2 joined', { exact: false }).first().waitFor();

  await member.reload();
  await fillPrivateDetails(member, 30000);

  await admin.reload();
  await admin.getByText('1 still needs to add their trip details', { exact: false }).waitFor({ state: 'detached', timeout: 20_000 }).catch(() => {});
  if (generateAi) {
    await generateDestination(admin);
  } else {
    log('core flow complete (set FERMAT_SIMULATOR_GENERATE_AI=true to include Groq)');
  }

  log(`PASS: ${tripName}`);
} catch (error) {
  await Promise.allSettled([
    admin.screenshot({ path: 'simulator-admin-failure.png', fullPage: true }),
    member.screenshot({ path: 'simulator-member-failure.png', fullPage: true }),
  ]);
  console.error('[simulator] FAIL — screenshots saved in the project root');
  throw error;
} finally {
  await browser.close();
}
