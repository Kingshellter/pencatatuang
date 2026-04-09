import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";

/**
 * Membuat instance MCP Server
 */
const server = new Server(
  {
    name: "pencatatuang-mcp-server",
    version: "0.1.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

/**
 * Daftar Alat (Tools) yang tersedia untuk AI
 */
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: "get_server_time",
        description: "Mendapatkan waktu server saat ini",
        inputSchema: {
          type: "object",
          properties: {},
        },
      },
    ],
  };
});

/**
 * Logika eksekusi ketika AI memanggil alat
 */
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  if (request.params.name === "get_server_time") {
    return {
      content: [
        {
          type: "text",
          text: `Waktu server saat ini adalah: ${new Date().toLocaleString()}`,
        },
      ],
    };
  }

  throw new Error(`Tool tidak ditemukan: ${request.params.name}`);
});

/**
 * Menjalankan server menggunakan transportasi Stdio
 */
async function runServer() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Pencatatuang MCP Server running on stdio");
}

runServer().catch((error) => {
  console.error("Gagal menjalankan MCP Server:", error);
  process.exit(1);
});
