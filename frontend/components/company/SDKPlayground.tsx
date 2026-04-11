"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Copy, Play, CheckCircle, XCircle } from "lucide-react";
import { toast } from "sonner";

type PlaygroundExample = {
  title: string;
  description: string;
  code: string;
  endpoint: string;
  method?: "GET" | "POST" | "PUT" | "DELETE";
  payload?: Record<string, unknown>;
};

const examples: Record<string, PlaygroundExample> = {
  register: {
    title: "Register User Data",
    description: "Automatically register user data with GDPR compliance",
    code: `import { OblivionSDK } from '@oblivion/sdk';

const sdk = new OblivionSDK({
  apiKey: 'your-api-key',
  serviceName: 'MyCompany'
});

// Register user data
const result = await sdk.registerUserData(
  'did:midnight:user_123',
  { 
    name: 'John Doe', 
    email: 'john@example.com',
    phone: '+1234567890'
  },
  'profile'
);

console.log('Commitment hash:', result.commitmentHash);
console.log('Blockchain TX:', result.blockchainTx);`,
    endpoint: "/api/register-data",
    payload: {
      userDID: "did:midnight:demo_user_" + Date.now(),
      data: {
        name: "John Doe",
        email: "john@example.com",
        phone: "+1234567890",
      },
      dataType: "profile",
    },
  },
  delete: {
    title: "Handle Deletion Request",
    description: "Process GDPR deletion requests with cryptographic proof",
    code: `// Handle deletion request
const deletion = await sdk.handleDeletion('did:midnight:user_123');

console.log(\`Deleted \${deletion.deletedCount} records\`);
console.log('Blockchain proofs:', deletion.blockchainProofs);

// Each proof is verifiable on the blockchain
deletion.blockchainProofs.forEach((proof, index) => {
  console.log(\`Proof \${index + 1}: \${proof}\`);
});`,
    endpoint: "/api/user/did:midnight:demo_user/delete-all",
    method: "DELETE",
  },
  query: {
    title: "Query User Data",
    description: "Get user data footprint for Right to Access compliance",
    code: `// Get user data footprint
const data = await sdk.getUserData('did:midnight:user_123');

console.log('User has', data.data.length, 'data records');

data.data.forEach(record => {
  console.log(\`- \${record.dataType}: \${record.commitmentHash}\`);
  console.log(\`  Created: \${new Date(record.createdAt).toLocaleDateString()}\`);
  console.log(\`  Deleted: \${record.deleted}\`);
});`,
    endpoint: "/api/user/did:midnight:demo_user/footprint",
    method: "GET",
  },
};

type ExampleKey = keyof typeof examples;

export function SDKPlayground() {
  const [activeTab, setActiveTab] = useState<ExampleKey>("register");
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const runExample = async () => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const example = examples[activeTab];
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

      try {
        const response = await fetch(`${apiUrl}${example.endpoint}`, {
          method: example.method || "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: "Bearer demo-api-key",
          },
          body: example.payload ? JSON.stringify(example.payload) : undefined,
        });

        if (response.ok) {
          const data = await response.json();
          setResult(data);
          toast.success("Example executed successfully!");
          return;
        }
      } catch (backendError) {
        console.log("Backend not available, using demo response");
      }

      // Fallback: Demo mode response
      const demoResponses: Record<ExampleKey, unknown> = {
        register: {
          success: true,
          commitmentHash: "0x" + Math.random().toString(16).slice(2, 66),
          blockchainTx: "0x" + Math.random().toString(16).slice(2, 66),
          message: "Data registered successfully (demo mode)",
          note: "Backend not running - this is a simulated response",
        },
        delete: {
          success: true,
          deletedCount: 3,
          blockchainProofs: [
            "0x" + Math.random().toString(16).slice(2, 66),
            "0x" + Math.random().toString(16).slice(2, 66),
            "0x" + Math.random().toString(16).slice(2, 66),
          ],
          message: "Data deleted successfully (demo mode)",
          note: "Backend not running - this is a simulated response",
        },
        query: {
          success: true,
          data: [
            {
              commitmentHash: "0x" + Math.random().toString(16).slice(2, 66),
              dataType: "profile",
              createdAt: new Date().toISOString(),
              deleted: false,
            },
            {
              commitmentHash: "0x" + Math.random().toString(16).slice(2, 66),
              dataType: "transactions",
              createdAt: new Date(Date.now() - 86400000).toISOString(),
              deleted: false,
            },
          ],
          message: "Data retrieved successfully (demo mode)",
          note: "Backend not running - this is a simulated response",
        },
      };

      setResult(demoResponses[activeTab]);
      toast.success("Example executed successfully (demo mode)!");
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error";
      setError(errorMessage);
      toast.error(`Failed to execute example: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  const copyCode = () => {
    navigator.clipboard.writeText(examples[activeTab].code);
    toast.success("Code copied to clipboard!");
  };

  const currentExample = examples[activeTab];

  return (
    <Card className="p-6">
      <div className="mb-6">
        <h3 className="text-2xl font-bold mb-2">SDK Playground</h3>
        <p className="text-gray-600">
          Try the Oblivion SDK with live examples. Click "Run Example" to see
          real API responses.
        </p>
      </div>

      <Tabs
        value={activeTab}
        onValueChange={(value) => setActiveTab(value as ExampleKey)}
      >
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="register">Register Data</TabsTrigger>
          <TabsTrigger value="delete">Handle Deletion</TabsTrigger>
          <TabsTrigger value="query">Query Data</TabsTrigger>
        </TabsList>

        {Object.entries(examples).map(([key, example]) => (
          <TabsContent key={key} value={key} className="space-y-4">
            <div>
              <h4 className="font-semibold text-lg mb-1">{example.title}</h4>
              <p className="text-sm text-gray-600 mb-4">
                {example.description}
              </p>
            </div>

            <div className="relative">
              <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto text-sm">
                <code>{example.code}</code>
              </pre>
              <Button
                size="sm"
                variant="ghost"
                className="absolute top-2 right-2 text-gray-400 hover:text-gray-100"
                onClick={copyCode}
              >
                <Copy className="w-4 h-4" />
              </Button>
            </div>
          </TabsContent>
        ))}
      </Tabs>

      <div className="mt-6 flex gap-2">
        <Button onClick={runExample} disabled={loading} className="gap-2">
          <Play className="w-4 h-4" />
          {loading ? "Running..." : "Run Example"}
        </Button>
        <Button variant="outline" onClick={copyCode} className="gap-2">
          <Copy className="w-4 h-4" />
          Copy Code
        </Button>
      </div>

      {error && (
        <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
          <XCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="font-semibold text-red-900 mb-1">Error</h4>
            <p className="text-sm text-red-700">{error}</p>
          </div>
        </div>
      )}

      {result && (
        <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle className="w-5 h-5 text-green-500" />
            <h4 className="font-semibold text-green-900">Result</h4>
          </div>
          <pre className="text-sm overflow-x-auto bg-white p-3 rounded border border-green-200">
            {JSON.stringify(result, null, 2)}
          </pre>
        </div>
      )}

      <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <h4 className="font-semibold text-blue-900 mb-2">Installation</h4>
        <pre className="bg-blue-900 text-blue-100 p-3 rounded text-sm">
          npm install @oblivion/sdk
        </pre>
        <p className="text-sm text-blue-700 mt-2">
          Get your API key from the{" "}
          <a href="/company/setup" className="underline font-semibold">
            integration setup page
          </a>
        </p>
      </div>
    </Card>
  );
}
