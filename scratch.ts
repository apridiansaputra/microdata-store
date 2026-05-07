import { fetchProvinces } from './lib/location/indonesia';

async function test() {
  try {
    console.log("Fetching provinces...");
    const data = await fetchProvinces();
    console.log("SUCCESS:", data.slice(0, 2));
  } catch (err) {
    console.error("ERROR:", err);
  }
}
test();
