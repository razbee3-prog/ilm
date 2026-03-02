/**
 * Server metadata — maps MCP server URLs to branded display info.
 * Used by ToolCard to render logos, colors, descriptions, and capabilities.
 */

export interface ServerMetadata {
  displayName: string;
  description: string;
  capabilities: string[];
  accentColor: string;
  logo: string; // inline SVG
}

const SERVER_METADATA: { match: (url: string) => boolean; meta: ServerMetadata }[] = [
  {
    match: (url) => url.includes("slack.com"),
    meta: {
      displayName: "Slack",
      description: "Team messaging & collaboration",
      capabilities: ["Search messages", "Send DMs", "Manage channels"],
      accentColor: "#611f69",
      logo: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M5.042 15.165a2.528 2.528 0 0 1-2.52 2.523A2.528 2.528 0 0 1 0 15.165a2.527 2.527 0 0 1 2.522-2.52h2.52v2.52zm1.271 0a2.527 2.527 0 0 1 2.521-2.52 2.527 2.527 0 0 1 2.521 2.52v6.313A2.528 2.528 0 0 1 8.834 24a2.528 2.528 0 0 1-2.521-2.522v-6.313zM8.834 5.042a2.528 2.528 0 0 1-2.521-2.52A2.528 2.528 0 0 1 8.834 0a2.528 2.528 0 0 1 2.521 2.522v2.52H8.834zm0 1.271a2.528 2.528 0 0 1 2.521 2.521 2.528 2.528 0 0 1-2.521 2.521H2.522A2.528 2.528 0 0 1 0 8.834a2.528 2.528 0 0 1 2.522-2.521h6.312zM18.956 8.834a2.528 2.528 0 0 1 2.522-2.521A2.528 2.528 0 0 1 24 8.834a2.528 2.528 0 0 1-2.522 2.521h-2.522V8.834zm-1.27 0a2.528 2.528 0 0 1-2.523 2.521 2.527 2.527 0 0 1-2.52-2.521V2.522A2.527 2.527 0 0 1 15.163 0a2.528 2.528 0 0 1 2.523 2.522v6.312zM15.163 18.956a2.528 2.528 0 0 1 2.523 2.522A2.528 2.528 0 0 1 15.163 24a2.527 2.527 0 0 1-2.52-2.522v-2.522h2.52zm0-1.27a2.527 2.527 0 0 1-2.52-2.523 2.526 2.526 0 0 1 2.52-2.52h6.315A2.528 2.528 0 0 1 24 15.163a2.528 2.528 0 0 1-2.522 2.523h-6.315z"/></svg>`,
    },
  },
  {
    match: (url) => url.includes("google-workspace") || url.includes("google_workspace") || (url.includes("localhost") && url.includes("3340")),
    meta: {
      displayName: "Google Workspace",
      description: "Gmail, Calendar, Drive, Docs & Sheets",
      capabilities: ["Email & Calendar", "Drive & Docs", "Sheets & Slides"],
      accentColor: "#4285f4",
      logo: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>`,
    },
  },
  {
    match: (url) => url.includes("gmail") || (url.includes("google.com") && url.includes("gmail")),
    meta: {
      displayName: "Gmail",
      description: "Email management & communication",
      capabilities: ["Search emails", "Draft messages", "Manage labels"],
      accentColor: "#ea4335",
      logo: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M24 5.457v13.909c0 .904-.732 1.636-1.636 1.636h-3.819V11.73L12 16.64l-6.545-4.91v9.273H1.636A1.636 1.636 0 0 1 0 19.366V5.457c0-2.023 2.309-3.178 3.927-1.964L5.455 4.64 12 9.548l6.545-4.91 1.528-1.145C21.69 2.28 24 3.434 24 5.457z"/></svg>`,
    },
  },
  {
    match: (url) => url.includes("calendar") || url.includes("gcal"),
    meta: {
      displayName: "Google Calendar",
      description: "Schedule & event management",
      capabilities: ["View events", "Create meetings", "Find free time"],
      accentColor: "#4285f4",
      logo: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M18.316 5.684H24v12.632h-5.684V5.684zM5.684 24h12.632v-5.684H5.684V24zM18.316 5.684V0H5.684v5.684h12.632zM5.684 18.316H0V5.684h5.684v12.632zM7.997 14.11l1.242-1.026c.449-.368.741-.742.741-1.24 0-.674-.519-1.244-1.527-1.244-.768 0-1.282.368-1.663.858l1.063.694c.166-.259.37-.42.619-.42.236 0 .383.131.383.339 0 .236-.176.407-.48.657l-1.725 1.436V15.5h3.48v-1.39H7.997zm4.937-3.398h-.01l-1.469.497.244 1.178.869-.352V15.5h1.336V10.1h-.97v.612z"/></svg>`,
    },
  },
  {
    match: (url) => url.includes("notion.so") || url.includes("notion"),
    meta: {
      displayName: "Notion",
      description: "Workspace & knowledge management",
      capabilities: ["Search pages", "Create databases", "Manage content"],
      accentColor: "#ffffff",
      logo: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M4.459 4.208c.746.606 1.026.56 2.428.466l13.215-.793c.28 0 .047-.28-.046-.326L18.29 2.09c-.467-.373-.746-.56-1.586-.466l-12.75.793c-.466.047-.56.28-.373.466l.878 1.325zm.793 3.08v13.904c0 .746.373 1.026 1.212.98l14.523-.84c.84-.046.934-.56.934-1.166V6.354c0-.607-.233-.934-.746-.887l-15.177.887c-.56.047-.746.327-.746.934zm14.337.42c.093.42 0 .84-.42.888l-.7.14v10.264c-.607.327-1.166.514-1.633.514-.746 0-.933-.234-1.493-.934l-4.572-7.186v6.952l1.446.327s0 .84-1.166.84l-3.219.187c-.093-.187 0-.653.327-.746l.84-.233V9.854L7.822 9.76c-.094-.42.14-1.026.793-1.073l3.452-.233 4.759 7.279V9.34l-1.213-.14c-.093-.514.28-.887.747-.933l3.219-.187z"/></svg>`,
    },
  },
  {
    match: (url) => url.includes("linear.app") || url.includes("linear"),
    meta: {
      displayName: "Linear",
      description: "Issue tracking & project management",
      capabilities: ["Track issues", "Manage projects", "Create tickets"],
      accentColor: "#5e6ad2",
      logo: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M2.886 10.28a10.098 10.098 0 0 0-.528 1.9L10.82 3.72a10.17 10.17 0 0 0-1.9.527L2.886 10.28zm-.99 3.675L10.955 4.896a9.04 9.04 0 0 0-1.098-.322L1.574 12.857c.075.376.174.745.295 1.098h.028zM1.2 14.652l8.148-8.148c-.599-.147-1.225-.226-1.876-.226-.382 0-.756.028-1.12.08L.876 11.834A9.88 9.88 0 0 0 1.2 14.652zm-.196.732a10.083 10.083 0 0 0 .658 1.612L10.998 7.66a9.955 9.955 0 0 0-1.612-.658l-8.382 8.382zm1.27 2.584a10.079 10.079 0 0 0 1.026 1.35L14.586 8.032a10.078 10.078 0 0 0-1.35-1.026L2.274 17.968zm2.152 2.152a10.074 10.074 0 0 0 1.35 1.026l10.962-10.962a10.079 10.079 0 0 0-1.026-1.35L4.426 20.12zm2.584 1.27a9.955 9.955 0 0 0 1.612.658l8.382-8.382a10.083 10.083 0 0 0-.658-1.612L7.01 21.39zm2.694.81c.376.121.745.22 1.098.295l8.283-8.283c-.075-.376-.174-.745-.295-1.098L9.704 22.2zm2.132.39a10.17 10.17 0 0 0 1.9-.527l6.034-6.034a10.098 10.098 0 0 0-.528-1.9L11.836 22.59zm3.016-1.022a10.053 10.053 0 0 0 2.312-1.568l2.628-2.628a10.053 10.053 0 0 0-1.568-2.312l-3.372 6.508zm3.64-3.64a10.007 10.007 0 0 0 1.178-1.752l.73-1.414a9.946 9.946 0 0 0-.454-2.208l-1.454 5.374zm1.966-5.202a9.888 9.888 0 0 0 .324-3.726 10.001 10.001 0 0 0-3.726.324l3.402 3.402z"/></svg>`,
    },
  },
  {
    match: (url) => url.includes("atlassian.com") || url.includes("jira"),
    meta: {
      displayName: "Atlassian",
      description: "Project tracking & team collaboration",
      capabilities: ["Manage issues", "Track sprints", "Search Confluence"],
      accentColor: "#0052cc",
      logo: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M11.571 7.757c-.267-.399-.627-.56-1.016-.162L.32 18.849c-.268.38-.107.689.399.689h7.455c.267 0 .534-.16.668-.4 1.589-3.17 1.073-7.5-1.271-11.381zm2.845-5.39c-3.295 5.425-2.934 11.39.134 16.022.178.268.445.427.712.427h7.455c.534 0 .694-.31.4-.688L14.844 2.527c-.24-.41-.534-.56-.828-.16z" opacity=".88"/></svg>`,
    },
  },
  {
    match: (url) => url.includes("figma.com") || url.includes("figma"),
    meta: {
      displayName: "Figma",
      description: "Design & prototyping platform",
      capabilities: ["Browse files", "Inspect designs", "Get components"],
      accentColor: "#a259ff",
      logo: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M15.852 8.981h-4.588V0h4.588c2.476 0 4.49 2.014 4.49 4.49s-2.014 4.491-4.49 4.491zM12.735 7.51h3.117c1.665 0 3.019-1.355 3.019-3.019s-1.355-3.019-3.019-3.019h-3.117V7.51zm0 8.943h-4.588c-2.476 0-4.49-2.014-4.49-4.49s2.014-4.49 4.49-4.49h4.588v8.981zM8.148 8.941c-1.665 0-3.019 1.355-3.019 3.019s1.354 3.02 3.019 3.02h3.117V8.94H8.148zm4.587 15.116h-4.588c-2.476 0-4.49-2.014-4.49-4.49s2.014-4.49 4.49-4.49h4.588v8.98zM8.148 16.548c-1.665 0-3.019 1.355-3.019 3.019s1.355 3.019 3.019 3.019h3.117v-6.038H8.148zm7.704-7.607c-2.476 0-4.49 2.014-4.49 4.49s2.014 4.49 4.49 4.49 4.49-2.014 4.49-4.49-2.014-4.49-4.49-4.49zm0 7.509c-1.665 0-3.019-1.355-3.019-3.019s1.355-3.019 3.019-3.019 3.019 1.355 3.019 3.019-1.354 3.019-3.019 3.019z"/></svg>`,
    },
  },
  {
    match: (url) => url.includes("hubspot.com") || url.includes("hubspot"),
    meta: {
      displayName: "HubSpot",
      description: "CRM & marketing automation",
      capabilities: ["Manage contacts", "Track deals", "Log activities"],
      accentColor: "#ff7a59",
      logo: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M18.164 7.93V5.084a2.198 2.198 0 0 0 1.267-1.984v-.066a2.2 2.2 0 0 0-2.198-2.198h-.066a2.2 2.2 0 0 0-2.198 2.198v.066a2.19 2.19 0 0 0 1.267 1.984V7.93a6.152 6.152 0 0 0-2.86 1.27L6.456 3.952a2.625 2.625 0 1 0-.96 1.2l6.8 5.016a6.151 6.151 0 0 0-.188 7.107l-2.065 2.065a1.753 1.753 0 0 0-.51-.084 1.771 1.771 0 1 0 1.77 1.771 1.753 1.753 0 0 0-.083-.51l2.036-2.036a6.172 6.172 0 1 0 4.908-9.551zm-.01 9.893a3.726 3.726 0 1 1 0-7.451 3.726 3.726 0 0 1 0 7.451z"/></svg>`,
    },
  },
  {
    match: (url) => url.includes("github.com") || url.includes("github"),
    meta: {
      displayName: "GitHub",
      description: "Code hosting & version control",
      capabilities: ["Browse repos", "Manage PRs", "Track issues"],
      accentColor: "#f0f0f0",
      logo: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"/></svg>`,
    },
  },
  {
    match: (url) => url.includes("asana.com") || url.includes("asana"),
    meta: {
      displayName: "Asana",
      description: "Work management & task tracking",
      capabilities: ["Manage tasks", "Track projects", "Update statuses"],
      accentColor: "#f06a6a",
      logo: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M18.78 12.653c-2.882 0-5.22 2.337-5.22 5.22s2.338 5.22 5.22 5.22 5.22-2.337 5.22-5.22-2.337-5.22-5.22-5.22zm-13.56 0c-2.882 0-5.22 2.337-5.22 5.22s2.338 5.22 5.22 5.22 5.22-2.337 5.22-5.22-2.337-5.22-5.22-5.22zM12 1.907c-2.882 0-5.22 2.337-5.22 5.22s2.338 5.22 5.22 5.22 5.22-2.337 5.22-5.22-2.337-5.22-5.22-5.22z"/></svg>`,
    },
  },
  {
    match: (url) => url.includes("intercom.io") || url.includes("intercom"),
    meta: {
      displayName: "Intercom",
      description: "Customer messaging & support",
      capabilities: ["Search conversations", "Manage contacts", "Send messages"],
      accentColor: "#286efa",
      logo: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M20.727 3H3.273A2.273 2.273 0 0 0 1 5.273v13.454A2.273 2.273 0 0 0 3.273 21h17.454A2.273 2.273 0 0 0 23 18.727V5.273A2.273 2.273 0 0 0 20.727 3zM7.125 15.634a.75.75 0 1 1-1.5 0V8.366a.75.75 0 1 1 1.5 0v7.268zm3.375.75a.75.75 0 0 1-.75-.75V6.366a.75.75 0 1 1 1.5 0v9.268a.75.75 0 0 1-.75.75zm3.375 0a.75.75 0 0 1-.75-.75V6.366a.75.75 0 1 1 1.5 0v9.268a.75.75 0 0 1-.75.75zm3.375-.75a.75.75 0 1 1-1.5 0V8.366a.75.75 0 1 1 1.5 0v7.268z"/></svg>`,
    },
  },
  {
    match: (url) => url.includes("microsoft.com") || url.includes("microsoft365") || url.includes("office"),
    meta: {
      displayName: "Microsoft 365",
      description: "Productivity & office suite",
      capabilities: ["Manage files", "Search email", "Schedule meetings"],
      accentColor: "#0078d4",
      logo: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M0 0v11.408h11.408V0zm12.594 0v11.408H24V0zM0 12.594V24h11.408V12.594zm12.594 0V24H24V12.594z"/></svg>`,
    },
  },
  {
    match: (url) => url.includes("datadog") || url.includes("datadoghq"),
    meta: {
      displayName: "Datadog",
      description: "Monitoring & observability platform",
      capabilities: ["View dashboards", "Query metrics", "Check alerts"],
      accentColor: "#632ca6",
      logo: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M13.143 11.652l-1.47-.267-.15-.03-.015.12c-.09.57-.375 1.057-.765 1.41l-.075.06.06.075c.345.465.84.78 1.395.855h.12l.015-.12c.09-.63-.015-1.29-.345-1.89l-.06-.12-.15.03-.06-.123zm-2.73-.06c.465-.12.87-.39 1.155-.765l.075-.09-.09-.075c-.435-.36-.975-.555-1.545-.555h-.12l-.015.12c-.045.615.12 1.215.45 1.71l.075.09.09-.075-.075.09.06-.06-.06.06zm-.015-2.52c.705.015 1.365.225 1.905.615l.09.075.075-.09c.465-.51.72-1.17.72-1.875v-.12l-.12.015c-.705.06-1.365.33-1.89.765l-.09.075.075.09c-.09-.12-.18-.24-.285-.345l-.09-.09-.09.075c-.405.33-.72.75-.915 1.23l-.06.12.12.06c.165.06.33.105.495.12l.06.015V9.61c0-.18.015-.36.045-.54zm7.185 7.575c-.225-.18-.495-.3-.795-.33.06-.195.09-.39.09-.6 0-1.095-.885-1.98-1.98-1.98-.27 0-.525.06-.765.15l-.09-.12c.195-.375.3-.795.3-1.24 0-.21-.03-.42-.075-.615l.09-.03c.105-.03.21-.075.315-.12l.09-.045-.045-.09c-.3-.645-.78-1.17-1.38-1.515l-.09-.06-.06.09c-.195.315-.33.66-.39 1.035l-.015.09.09.03c-.165-.09-.345-.165-.525-.21l-.12-.03-.03.12c-.15.585-.12 1.215.09 1.8l.03.09-.015.03c-.525-.39-1.17-.615-1.845-.615-.075 0-.15 0-.225.015l-.03-.12c-.09-.39-.27-.75-.51-1.065l-.075-.09-.09.075c-.48.42-.81.975-.945 1.59l-.015.12.12.015c.36.03.72-.015 1.065-.12l-.03.045c-.39.555-.6 1.215-.57 1.89v.015c-.645-.255-1.35-.33-2.04-.225l-.12.015.03.12c.18.63.555 1.185 1.065 1.59l.09.075.075-.09c-.33.075-.66.075-.99.015l-.12-.03-.015.12c-.045.69.135 1.365.51 1.935l.06.09.09-.06c.48-.315.87-.75 1.14-1.26.36.51.855.9 1.425 1.11l.12.045.03-.12c.06-.33.06-.66 0-.99.51.18 1.05.24 1.59.165l.12-.015-.03-.12c-.075-.285-.195-.555-.345-.795.435.015.87-.075 1.26-.27l.105-.06-.06-.105c-.255-.42-.615-.765-1.035-1.005.375-.195.705-.465.96-.795l.075-.09-.09-.075z"/></svg>`,
    },
  },
  {
    match: (url) => url.includes("pagerduty"),
    meta: {
      displayName: "PagerDuty",
      description: "Incident management & on-call",
      capabilities: ["Manage incidents", "View on-call", "Trigger alerts"],
      accentColor: "#06ac38",
      logo: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M16.965 1.18C15.085.164 13.769 0 10.683 0H3.73v14.55h6.926c2.743 0 4.8-.164 6.61-1.37 1.975-1.303 3.004-3.47 3.004-6.14 0-2.943-1.33-4.835-3.305-5.86zM12.56 10.2c-1.097.657-2.468.74-4.112.74H7.89V3.47h.904c1.617 0 2.825.11 3.838.795 1.07.712 1.7 1.89 1.7 2.907 0 1.26-.657 2.344-1.774 3.028zM3.73 17.616h4.16V24H3.73z"/></svg>`,
    },
  },
];

const DEFAULT_METADATA: ServerMetadata = {
  displayName: "MCP Server",
  description: "Model Context Protocol server",
  capabilities: ["Execute tools"],
  accentColor: "#3b82f6",
  logo: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>`,
};

/**
 * Look up branded metadata for a server by its URL.
 * Falls back to a generic default for unknown servers.
 */
export function getServerMetadata(url: string): ServerMetadata {
  for (const entry of SERVER_METADATA) {
    if (entry.match(url)) {
      return entry.meta;
    }
  }
  return DEFAULT_METADATA;
}
