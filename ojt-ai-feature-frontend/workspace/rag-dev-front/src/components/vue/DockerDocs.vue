<template>
  <div class="docs-container">
    <nav class="breadcrumb">Docs > Docker Engine > User Guide > {{ currentDoc.category }}</nav>
    
    <header class="main-header">
      <h1>{{ currentDoc.title }}</h1>
      <p class="lead">{{ currentDoc.lead }}</p>
    </header>

    <div class="docs-body">
      <section v-for="(section, index) in currentDoc.sections" :key="index">
        <h2>{{ index + 1 }}. {{ section.h2 }}</h2>
        <div v-html="section.content"></div>
        
        <template v-if="section.code">
          <div class="code-header">{{ section.codeHeader || 'Technical Implementation' }}</div>
          <pre class="code-block"><code>{{ section.code }}</code></pre>
        </template>

        <div v-if="section.callout" class="info-callout">
          <strong>Pro Tip:</strong> {{ section.callout }}
        </div>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';

const docLibrary = [
  {
    category: "Infrastructure & Networking",
    title: "High-Availability Network Architecture",
    lead: "A comprehensive guide to designing resilient, low-latency container networks for Japanese data centers (Tokyo/Osaka).",
    sections: [
      {
        h2: "Understanding the CNM Lifecycle",
        content: `
          <p>The Container Network Model (CNM) manages the lifecycle of container connectivity. In a production environment like <b>JP-East-1</b>, simply using the default bridge is insufficient. You must understand the interaction between Sandbox, Endpoint, and Network.</p>
          <p>Sandbox contains the configuration of a container's network stack. This includes management of the container's interfaces, routing tables, and DNS settings.</p>
        `,
        callout: "Avoid IP address conflicts by explicitly defining subnet ranges in your network create commands."
      },
      {
        h2: "Cross-Region Overlay Implementation",
        content: `
          <p>For services spanning multiple availability zones, <b>Overlay Networks</b> are mandatory. They use VXLAN encapsulation to create a L2 layer on top of L3 infrastructure. This allows containers on different hosts to communicate as if they were on the same local switch.</p>
          <table class="data-table">
            <thead><tr><th>Feature</th><th>Bridge</th><th>Overlay</th><th>Host</th></tr></thead>
            <tbody>
              <tr><td>Scope</td><td>Single Host</td><td>Multi-node Cluster</td><td>Host-wide</td></tr>
              <tr><td>Performance</td><td>Moderate</td><td>Encapsulation Overhead</td><td>Native (Fastest)</td></tr>
              <tr><td>Discovery</td><td>Automatic DNS</td><td>Gossip Protocol</td><td>None</td></tr>
            </tbody>
          </table>
        `,
        codeHeader: "Creating a Scalable Overlay Network",
        code: "$ docker network create --driver overlay \\\n  --attachable \\\n  --subnet 10.0.10.0/24 \\\n  --opt encrypted \\\n  production_mesh"
      },
      {
        h2: "Performance Optimization for Low Latency",
        content: `
          <p>When deploying high-frequency trading apps or real-time diagnostic tools in Osaka regions, packet fragmentation is your enemy. Tuning the MTU (Maximum Transmission Unit) to match your VPC's infrastructure is critical.</p>
          <p>Standard Ethernet MTU is 1500, but VXLAN adds 50 bytes of overhead. Setting your container MTU to 1450 prevents costly kernel-level fragmentation.</p>
        `,
        codeHeader: "Daemon Optimization (daemon.json)",
        code: "{\n  \"mtu\": 1450,\n  \"dns\": [\"10.0.0.2\", \"8.8.8.8\"],\n  \"experimental\": false\n}"
      }
    ]
  },
  {
    category: "Storage Engineering",
    title: "Enterprise Data Persistence Strategies",
    lead: "Mastering stateful workloads, volume management, and high-performance storage drivers in hybrid cloud environments.",
    sections: [
      {
        h2: "The Persistence Hierarchy",
        content: `
          <p>In Docker, data should never live inside a container's writable layer. We distinguish between three primary patterns: <b>Volumes</b>, <b>Bind Mounts</b>, and <b>tmpfs</b>.</p>
          <ul>
            <li><b>Volumes:</b> Managed by Docker, abstracted from host path, best for database persistence.</li>
            <li><b>Bind Mounts:</b> Tied to host FS structure, critical for config files and dev environments.</li>
            <li><b>tmpfs:</b> Memory-only storage, essential for sensitive tokens and transient session data.</li>
          </ul>
        `,
        callout: "Never use Bind Mounts for database data directories in production due to OS-level locking issues."
      },
      {
        h2: "Distributed Storage with Local Flavor",
        content: `
          <p>For Japanese enterprises using <b>AWS EFS</b> or <b>Azure Files</b>, the local driver can be configured to act as an NFS client. This allows multiple containers across different nodes to share the same persistent state (e.g., WordPress uploads or shared logs).</p>
        `,
        codeHeader: "NFSv4.1 High-Performance Mount",
        code: "$ docker volume create --driver local \\\n  --opt type=nfs \\\n  --opt o=addr=fs-xxxx.efs.ap-northeast-1.amazonaws.com,nfsvers=4.1,rsize=1048576,wsize=1048576,hard,timeo=600,retrans=2 \\\n  --opt device=:/ \\\n  cloud_shared_vol"
      },
      {
        h2: "I/O Scheduling and Database Performance",
        content: `
          <p>For high-transaction databases like <b>PostgreSQL 16</b>, the host's I/O scheduler must be optimized. The 'deadline' scheduler is usually preferred over 'cfq' for database workloads to ensure predictable latency.</p>
          <p>Additionally, using the <code>--shm-size</code> flag is vital for memory-intensive containers to prevent bus errors during heavy query execution.</p>
        `,
        codeHeader: "Optimized DB Deployment",
        code: "services:\n  db:\n    image: postgres:16-alpine\n    shm_size: '256mb'\n    volumes:\n      - pg_data:/var/lib/postgresql/data\n    deploy:\n      resources:\n        limits:\n          memory: 2G"
      }
    ]
  },
  {
    category: "Security & Operations",
    title: "Hardening the Software Supply Chain",
    lead: "Comprehensive security measures for securing Docker images and runtime environments in regulated industries.",
    sections: [
      {
        h2: "Multi-Stage Build Security",
        content: `
          <p>Security starts at build time. Traditional images contain build tools (compilers, git, ssh) that serve as a playground for attackers. Multi-stage builds solve this by separating the build environment from the execution environment.</p>
          <p>In the final stage, use <b>Distroless</b> or minimal Alpine images to minimize the attack surface (CVE count).</p>
        `,
        codeHeader: "Secure Multi-Stage Dockerfile",
        code: "# Stage 1: Build\nFROM golang:1.21 AS build\nCOPY . /app\nRUN cd /app && go build -o main\n\n# Stage 2: Secure Runtime\nFROM gcr.io/distroless/static-debian12\nCOPY --from=build /app/main /main\nUSER nonroot:nonroot\nENTRYPOINT [\"/main\"]"
      },
      {
        h2: "Runtime Defense-in-Depth",
        content: `
          <p>Even with a secure image, runtime protection is necessary. Utilizing <b>AppArmor</b> or <b>SELinux</b> profiles can prevent a compromised container from accessing the host kernel or sensitive files.</p>
          <p>In Japan, the <b>ISMS</b> standard requires strict adherence to the principle of least privilege. This means dropping all Linux capabilities and only adding what is strictly necessary.</p>
        `,
        callout: "Running with --read-only filesystem makes it significantly harder for malware to persist within a container."
      },
      {
        h2: "Automated Vulnerability Scanning",
        content: `
          <p>Manual security audits are insufficient for rapid CI/CD cycles. Integration of <b>Trivy</b> or <b>Snyk</b> into your pipeline ensures that every commit is scanned for known vulnerabilities (CVEs).</p>
        `,
        codeHeader: "CI Pipeline Security Gate",
        code: "stages:\n  - build\n  - scan\n  - deploy\n\nsecurity_scan:\n  image: aquasec/trivy:latest\n  script:\n    - trivy image --exit-code 1 --severity CRITICAL my-app:latest"
      }
    ]
  }
];

const currentDoc = ref(docLibrary[0]);

onMounted(() => {
  const randomIndex = Math.floor(Math.random() * docLibrary.length);
  currentDoc.value = docLibrary[randomIndex];
});
</script>

<style scoped>
.docs-container { padding: 40px; color: #333; line-height: 1.7; max-width: 1100px; margin-left: 0; text-align: left; }
.breadcrumb { font-size: 13px; color: #888; margin-bottom: 24px; text-transform: uppercase; letter-spacing: 0.5px; }
.main-header { border-bottom: 2px solid #2496ed; margin-bottom: 40px; padding-bottom: 25px; }
.main-header h1 { font-size: 3rem; color: #1d2b36; margin: 0; line-height: 1.1; }
.lead { font-size: 1.3rem; color: #555; margin-top: 15px; font-weight: 300; }

h2 { font-size: 1.9rem; margin-top: 50px; color: #2496ed; display: flex; align-items: center; }
h2::before { content: ""; display: inline-block; width: 4px; height: 24px; background: #2496ed; margin-right: 12px; border-radius: 2px; }

:deep(p) { margin: 18px 0; font-size: 1.05rem; }
:deep(ul) { padding-left: 20px; margin: 15px 0; }
:deep(li) { margin-bottom: 10px; }
:deep(code) { background: #f0f4f8; color: #d63384; padding: 3px 6px; border-radius: 4px; font-family: 'SFMono-Regular', Consolas, monospace; font-size: 0.9em; }

.info-callout { background: #f0f7ff; border-left: 5px solid #2496ed; padding: 20px; margin: 30px 0; border-radius: 0 8px 8px 0; font-size: 1rem; color: #2c5282; }

.code-header { background: #2d3748; color: #a0aec0; padding: 8px 16px; font-size: 11px; border-radius: 6px 6px 0 0; font-family: monospace; text-transform: uppercase; }
.code-block { background: #1a202c; color: #e2e8f0; padding: 24px; border-radius: 0 0 6px 6px; font-family: 'Courier New', Courier, monospace; overflow-x: auto; margin-bottom: 30px; line-height: 1.5; font-size: 0.95rem; }

.data-table { width: 100%; border-collapse: separate; border-spacing: 0; margin: 30px 0; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden; }
.data-table th, .data-table td { padding: 14px 18px; text-align: left; border-bottom: 1px solid #e2e8f0; }
.data-table th { background: #f7fafc; font-weight: 700; color: #4a5568; }
.data-table tr:last-child td { border-bottom: none; }
</style>