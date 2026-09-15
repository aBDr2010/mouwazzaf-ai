import { spawn } from "child_process";
import { setTimeout as sleep } from "timers/promises";

const server = spawn("node", ["dist/index.js"], {
  cwd: "C:\\Users\\abderrahmane\\Downloads\\Mouwazzaf AI\\server",
  stdio: ["ignore", "pipe", "pipe"],
});
server.stdout.on("data", d => process.stdout.write("[server] "+d));
server.stderr.on("data", d => process.stderr.write("[server-err] "+d));

await sleep(2500);

const base = "http://localhost:3000/api/v1";
async function req(method, path, body) {
  const res = await fetch(base + path, {
    method,
    headers: { "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });
  const json = await res.json().catch(()=> ({}));
  return { status: res.status, json };
}

let failures = 0;
function assert(cond, msg) {
  if (!cond) { console.error("❌ FAIL:", msg); failures++; }
  else console.log("✅", msg);
}

try {
  let r = await req("GET", "/health");
  assert(r.status===200 && r.json.success, "health");
  console.log(r.json);

  r = await req("GET", "/businesses/00000000-0000-4000-a000-000000000001");
  assert(r.json.success && r.json.data.name==="BladiPhone", "get seeded business");
  console.log("business:", r.json.data.name);

  r = await req("GET", "/businesses/00000000-0000-4000-a000-000000000001/products");
  assert(r.json.success && r.json.data.length===4, "seeded products 4");
  console.log("products:", r.json.data.map(p=>p.name).join(", "));

  r = await req("GET", "/businesses/00000000-0000-4000-a000-000000000001/activities");
  assert(r.json.success, "activities");

  // Chat flow test
  const businessId = "00000000-0000-4000-a000-000000000001";
  const sessionId = "test_sess_" + Date.now();

  r = await req("POST", "/chat", { businessId, sessionId, message: "سلام" });
  assert(r.json.success && r.json.message.content.includes("سلام"), "chat greeting");
  console.log("chat سلام:", r.json.message.content.slice(0,80));

  r = await req("POST", "/chat", { businessId, sessionId, message: "عندكم iPhone 13؟" });
  assert(r.json.success && r.json.message.content.includes("iPhone") || r.json.message.content.includes("متوفر"), "chat iPhone query");
  console.log("chat iphone:", r.json.message.content.slice(0,120));
  console.log("actions:", JSON.stringify(r.json.actions).slice(0,200));

  r = await req("POST", "/chat", { businessId, sessionId, message: "شحال؟" });
  assert(r.json.success, "chat price");
  console.log("chat price:", r.json.message.content.slice(0,120));

  r = await req("POST", "/chat", { businessId, sessionId, message: "نحب واحد" });
  assert(r.json.success, "chat order intent 1");
  console.log("chat نحب واحد:", r.json.message.content.slice(0,150));

  r = await req("POST", "/chat", { businessId, sessionId, message: "محمد" });
  console.log("chat name محمد:", r.json.message.content.slice(0,120));

  r = await req("POST", "/chat", { businessId, sessionId, message: "0550000000" });
  console.log("chat phone:", r.json.message.content.slice(0,120));

  r = await req("POST", "/chat", { businessId, sessionId, message: "البليدة" });
  console.log("chat wilaya:", r.json.message.content.slice(0,120));

  r = await req("POST", "/chat", { businessId, sessionId, message: "البليدة" });
  assert(r.json.success && r.json.message.content.includes("سجلتلك"), "order created");
  console.log("chat commune -> order:", r.json.message.content.slice(0,200));
  console.log("order actions:", JSON.stringify(r.json.actions).slice(0,400));

  // Check orders created
  r = await req("GET", `/businesses/${businessId}/orders`);
  assert(r.json.success && r.json.data.length >=1, "orders list has order");
  console.log("orders count:", r.json.data.length, "first:", r.json.data[0]?.product?.name, r.json.data[0]?.customer?.name);

  // Check customers
  r = await req("GET", `/businesses/${businessId}/customers`);
  assert(r.json.success && r.json.data.length >=1, "customers");
  console.log("customers:", r.json.data.map(c=>c.name).join(", "));

  // Conversations
  r = await req("GET", `/conversations/${sessionId}`);
  assert(r.json.success && r.json.data.length >= 7, "conversations saved");
  console.log("conv messages:", r.json.data.length);

  // Activities
  r = await req("GET", `/businesses/${businessId}/activities`);
  assert(r.json.success && r.json.data.length >=3, "activities after chat");
  console.log("activities:", r.json.data.slice(0,3).map(a=>a.description).join(" | "));

  // Stats
  r = await req("GET", `/businesses/${businessId}/stats`);
  assert(r.json.success && r.json.data.orders >=1, "stats");
  console.log("stats:", r.json.data);

  // n8n incoming
  r = await req("POST", "/webhooks/n8n/incoming", {
    event: "customer_message",
    businessId,
    sessionId: "wa_test_" + Date.now(),
    message: "سلام، عندكم Samsung؟",
    channel: "whatsapp"
  });
  assert(r.json.success && r.json.reply, "n8n incoming");
  console.log("n8n reply:", r.json.reply.slice(0,100));

  // products patch
  const prodId = "10000000-0000-4000-a000-000000000001";
  r = await req("PATCH", `/products/${prodId}`, { stock: 99 });
  // This route is protected but DISABLE_AUTH true, should work via /api/v1/products... Actually protected route is /api/v1/products -> we used base includes /api/v1, so PATCH /products/:id is under /api/v1/products
  // Our earlier direct path was /products/:id but server mounts at /api/v1/products, so need full path
  // Let's try again with correct base? We already used /products, but server mounts protected at /api/v1 -> so /api/v1/products should work, but we used req to /api/v1/products? Our req base is /api/v1, and we called /products/:id -> becomes /api/v1/products/:id correct.
  console.log("patch product:", r.json);

  // create business
  r = await req("POST", "/businesses", {
    name: "TestShop",
    category: "خدمات",
    city: "عنابة",
    phone: "0551112222",
    description: "test shop",
    working_hours: "09:00-18:00",
    delivery_info: "توصيل",
  });
  assert(r.json.success && r.json.data.id, "create business");
  console.log("new business:", r.json.data.id, r.json.data.name);
  const newBizId = r.json.data.id;
  r = await req("GET", `/businesses/${newBizId}/products`);
  assert(r.json.success && r.json.data.length>=3, "new business seeded products");

  console.log("\n--- SUMMARY ---");
  if (failures===0) console.log("✅ All tests passed");
  else console.log(`❌ ${failures} failures`);

} catch(e) {
  console.error("Test error", e);
  failures++;
} finally {
  server.kill();
  await sleep(500);
  process.exit(failures>0 ? 1 : 0);
}
