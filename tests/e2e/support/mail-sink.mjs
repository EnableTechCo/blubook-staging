import { createServer } from "node:http";

const port = Number(process.env.ONBOARDING_E2E_MAIL_PORT ?? 4321);
const messages = [];

const json = (response, status, value) => {
  response.writeHead(status, { "content-type": "application/json; charset=utf-8" });
  response.end(JSON.stringify(value));
};

const server = createServer(async (request, response) => {
  const url = new URL(request.url ?? "/", `http://127.0.0.1:${port}`);
  if (url.pathname === "/health" && request.method === "GET") return json(response, 200, { status: "ok" });

  if (url.pathname === "/api/v1.0/email/send" && request.method === "POST") {
    let body = "";
    for await (const chunk of request) body += chunk;
    try {
      messages.push(JSON.parse(body));
      return json(response, 200, { status: "sent" });
    } catch {
      return json(response, 400, { error: "Invalid test email payload" });
    }
  }

  if (url.pathname === "/messages" && request.method === "GET") {
    const recipient = url.searchParams.get("to_email");
    return json(response, 200, messages.filter((item) => item.template_params?.to_email === recipient));
  }

  if (url.pathname === "/messages" && request.method === "DELETE") {
    const recipient = url.searchParams.get("to_email");
    for (let index = messages.length - 1; index >= 0; index -= 1) {
      if (messages[index]?.template_params?.to_email === recipient) messages.splice(index, 1);
    }
    return json(response, 200, { deleted: true });
  }

  return json(response, 404, { error: "Not found" });
});

server.listen(port, "127.0.0.1");
