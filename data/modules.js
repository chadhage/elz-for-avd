/* =============================================================================
 * AVD on GCC High — Enterprise-Scale Landing Zone Assessment
 * Module content dataset (L400)
 * -----------------------------------------------------------------------------
 * Loaded as a plain <script> so the microsite runs fully offline (file://)
 * with no fetch/CORS dependency. Content is authored in a lightweight Markdown
 * subset rendered by js/app.js.
 *
 * Question schema:
 *   { id, type, label, help?, options?, placeholder?, required? }
 *   type: 'text' | 'textarea' | 'select' | 'radio' | 'checkbox' | 'scale'
 * ========================================================================== */
window.WORKSHOP_MODULES = [
  /* ======================================================================= *
   * 0. INTRODUCTION & ASSESSMENT OVERVIEW
   * ======================================================================= */
  {
    id: "intro",
    order: 0,
    title: "Introduction & Assessment Framing",
    short: "Intro",
    minutes: 30,
    icon: "◆",
    tagline: "Scope, sovereignty constraints, and the Enterprise-Scale design areas.",
    intro: `
## Purpose and scope

This assessment covers an **Azure Virtual Desktop (AVD)** estate hosted in **GCC High (Azure Government)** with **multi-tenant** dependencies. The topology inherits sovereign-cloud endpoints, ITAR/CMMC/DFARS obligations, a constrained service catalogue, and identity boundaries that differ from commercial Entra ID.

The assessment follows the **Cloud Adoption Framework (CAF) Enterprise-Scale** design areas and the **Azure Well-Architected Framework (WAF)** pillars. Each module records **current state (as-is)** and **target state (to-be)** to produce a traceable design backlog.

## GCC High constraints

- **Distinct cloud instance** — endpoints are \`*.usgovcloudapi.net\`, \`login.microsoftonline.us\`, and the portal at \`portal.azure.us\`. Automation, SDKs, and Terraform providers must target the US Gov cloud.
- **Constrained service catalogue** — not every commercial service or SKU is available; each dependency must be validated against Azure Government product availability.
- **Regions** — the AVD control plane and session hosts run in **US Gov Virginia** and **US Gov Arizona**, subject to metadata and service-object placement rules.
- **Identity** — **Microsoft Entra ID Government**. B2B guest and cross-cloud collaboration differ from commercial; multi-tenant designs must account for cross-cloud trust limits.
- **Compliance baseline** — typically **FedRAMP High**, **DoD IL4/IL5**, **CMMC L2**, **NIST SP 800-171**, and **ITAR** data-handling.

## Module procedure (30 min)

1. Confirm the **workload boundary**: user populations, data classifications, and tenants in scope.
2. Confirm the **sovereignty target** (GCC High or DoD, IL level, ATO path).
3. Record the **decision-makers** and the **assessment cadence**, which govern the migration and execution modules.
4. Captured inputs are written to a portable **assessment.json**. Export at the end of each module to preserve state.

> Keep the reference dock open. Each design area links to first-party Microsoft documentation so decisions remain traceable to source.
`,
    references: [
      { title: "CAF — Azure landing zones", url: "https://learn.microsoft.com/en-us/azure/cloud-adoption-framework/ready/landing-zone/", note: "Design-area model this assessment follows." },
      { title: "CAF — Enterprise-scale architecture", url: "https://learn.microsoft.com/en-us/azure/cloud-adoption-framework/ready/enterprise-scale/architecture", note: "Reference platform topology." },
      { title: "Azure Well-Architected Framework", url: "https://learn.microsoft.com/en-us/azure/well-architected/", note: "Reliability, Security, Cost, Ops, Performance pillars." },
      { title: "Azure Government documentation", url: "https://learn.microsoft.com/en-us/azure/azure-government/", note: "Sovereign cloud fundamentals." },
      { title: "AVD in Azure Government", url: "https://learn.microsoft.com/en-us/azure/virtual-desktop/gov/", note: "GCC High / DoD specifics for AVD." },
      { title: "AVD enterprise-scale landing zone accelerator", url: "https://learn.microsoft.com/en-us/azure/cloud-adoption-framework/scenarios/wvd/", note: "Reference architecture and IaC accelerator." }
    ],
    currentState: [
      { id: "org_name", type: "text", label: "Organization / mission owner", placeholder: "e.g., Defense contractor BU, agency program office" },
      { id: "sovereign_target", type: "radio", label: "Target sovereign cloud", options: ["Azure Government (GCC High)", "Azure Government DoD (IL5)", "GCC (moderate) — evaluating uplift", "Undecided"] },
      { id: "existing_avd", type: "radio", label: "Existing AVD deployment", options: ["No — greenfield", "Yes — commercial cloud (migrating)", "Yes — already in GCC High", "Yes — other VDI (Citrix/Horizon/RDS)"] },
      { id: "current_broker", type: "select", label: "Current VDI broker", options: ["None (greenfield)", "AVD (GCC High / Azure Government)", "AVD (commercial)", "Citrix", "VMware Horizon", "Windows Server RDS", "Other"] },
      { id: "current_protocol", type: "select", label: "Current remote display protocol", options: ["RDP", "Citrix HDX/ICA", "PCoIP", "Blast Extreme", "Other", "N/A"] },
      { id: "current_host_os", type: "checkbox", label: "Current session-host OS", options: ["Windows 11 Enterprise multi-session", "Windows 11 Enterprise (single-session)", "Windows 10 Enterprise multi-session", "Windows 10 Enterprise (single-session)", "Windows Server 2022", "Windows Server 2019", "Windows Server 2016", "None (greenfield)", "Other"] },
      { id: "current_image_pipeline", type: "select", label: "Current image build pipeline", options: ["Manual golden image", "Packer", "Azure VM Image Builder", "MDT / Configuration Manager", "None", "Other"] },
      { id: "current_profile_solution", type: "select", label: "Current profile solution", options: ["FSLogix", "Roaming profiles / folder redirection", "Citrix UPM", "None", "Other"] },
      { id: "current_user_count", type: "text", label: "Current user count (named / concurrent)", placeholder: "e.g., 1,200 named / 800 concurrent" },
      { id: "user_population_summary", type: "text", label: "User populations & sizes (comma-separated)", placeholder: "e.g., 400 engineers; 1,200 corporate; 150 admins" },
      { id: "data_classifications", type: "checkbox", label: "Data classifications in scope", options: ["ITAR / EAR technical data", "CUI", "FCI", "PII / PHI", "Public / unclassified", "Other"] },
      { id: "entra_tenants", type: "text", label: "Entra tenants in scope (comma-separated)", placeholder: "e.g., contoso.onmicrosoft.com (commercial), contoso.onmicrosoft.us (gov)" },
      { id: "tenant_count", type: "select", label: "Number of Entra tenants", options: ["1", "2", "3", "4+"] },
      { id: "existing_trusts", type: "text", label: "Existing cross-tenant trusts / B2B (comma-separated)", placeholder: "e.g., B2B guests from partner; none gov\u2194commercial" },
      { id: "compliance_drivers", type: "checkbox", label: "Compliance drivers in force today", options: ["ITAR / EAR", "CMMC L2", "NIST SP 800-171", "FedRAMP High", "DoD IL4", "DoD IL5", "CJIS", "HIPAA", "None formalized yet"] },
      { id: "ato_state", type: "select", label: "ATO / authorization state", options: ["No ATO yet", "In assessment (SSP drafting)", "P-ATO / conditional", "Full ATO", "Reciprocity from another system"] },
      /* --- Azure WAF for AVD assessment (GCC High-framed, from WAF AVD workload CSV) --- */
      { id: "waf_design_principles", type: "checkbox", label: "WAF design principles — have you evaluated the workload holistically against the Azure Well-Architected Framework pillars?", help: "GCC High first: validate each pillar against Azure Government service parity, US Gov regions (Virginia/Arizona), and the ATO/compliance baseline. AVD second: assess the workload across all five WAF pillars.", options: ["We've evaluated our workload's reliability and resiliency and its ability to recover from failures.", "For maximum security, we apply the principle of Zero Trust.", "We estimate, rationalize, and monitor the overall cost of our workload.", "We've set up monitoring, we've automated build and release processes, and we've established clear roles for our Azure Virtual Desktop team to take on for governing and managing our workload.", "We've enabled horizontal scaling, and we've run tests to evaluate load.", "None of the above"] }
    ],
    toBeState: [
      { id: "workshop_objective", type: "text", label: "Primary objective of this engagement", placeholder: "e.g., ATO-ready AVD landing zone for 2,000 ITAR users in GCC High" },
      { id: "target_scale", type: "text", label: "Target concurrent / named user scale", placeholder: "e.g., 2,000 named / 1,200 concurrent at steady state" },
      { id: "raci_identity_r", type: "text", label: "Identity — Responsible (R)", placeholder: "Name / role / email address" },
      { id: "raci_identity_a", type: "text", label: "Identity — Accountable (A)", placeholder: "Name / role / email address" },
      { id: "raci_identity_c", type: "text", label: "Identity — Consulted (C)", placeholder: "Name / role / email address" },
      { id: "raci_identity_i", type: "text", label: "Identity — Informed (I)", placeholder: "Name / role / email address" },
      { id: "raci_network_r", type: "text", label: "Network — Responsible (R)", placeholder: "Name / role / email address" },
      { id: "raci_network_a", type: "text", label: "Network — Accountable (A)", placeholder: "Name / role / email address" },
      { id: "raci_network_c", type: "text", label: "Network — Consulted (C)", placeholder: "Name / role / email address" },
      { id: "raci_network_i", type: "text", label: "Network — Informed (I)", placeholder: "Name / role / email address" },
      { id: "raci_security_r", type: "text", label: "Security — Responsible (R)", placeholder: "Name / role / email address" },
      { id: "raci_security_a", type: "text", label: "Security — Accountable (A)", placeholder: "Name / role / email address" },
      { id: "raci_security_c", type: "text", label: "Security — Consulted (C)", placeholder: "Name / role / email address" },
      { id: "raci_security_i", type: "text", label: "Security — Informed (I)", placeholder: "Name / role / email address" },
      { id: "raci_cost_r", type: "text", label: "Cost / FinOps — Responsible (R)", placeholder: "Name / role / email address" },
      { id: "raci_cost_a", type: "text", label: "Cost / FinOps — Accountable (A)", placeholder: "Name / role / email address" },
      { id: "raci_cost_c", type: "text", label: "Cost / FinOps — Consulted (C)", placeholder: "Name / role / email address" },
      { id: "raci_cost_i", type: "text", label: "Cost / FinOps — Informed (I)", placeholder: "Name / role / email address" },
      { id: "success_criteria_set", type: "checkbox", label: "Completion criteria for the landing zone", options: ["ATO-ready", "Pilot cohort live", "Cost/user target met", "All users migrated", "Controls satisfied (SSP)", "SLO met"] },
      { id: "success_criteria_other", type: "text", label: "Other completion criteria (comma-separated)", placeholder: "e.g., DR test passed" },
      { id: "hard_constraints", type: "checkbox", label: "Known hard constraints", options: ["Specific Gov region mandate", "Connectivity to on-prem classified network", "Data residency", "Air-gap / disconnected", "No commercial-cloud dependency", "Other"] },
      { id: "constraints_other", type: "text", label: "Other hard constraints (comma-separated)", placeholder: "e.g., SCIF-only access" },
      { id: "cadence", type: "select", label: "Assessment & design cadence", options: ["Single 1-day workshop", "Multi-day (module per session)", "Weekly recurring", "Asynchronous with review checkpoints"] }
    ]
  },

  /* ======================================================================= *
   * 1. IDENTITY & ACCESS
   * ======================================================================= */
  {
    id: "identity",
    order: 1,
    title: "Identity & Access Design",
    short: "Identity",
    minutes: 30,
    icon: "◈",
    tagline: "Entra ID Government, cross-tenant boundaries, Conditional Access, and privileged access for AVD.",
    intro: `
## Design area: Identity & Access Management

In GCC High, identity is provided by **Microsoft Entra ID Government** (\`login.microsoftonline.us\`). AVD session hosts must join a directory that authenticates the target user population and enforces CAC/PIV or phishing-resistant MFA where mandated.

### Directory and join model
- **Microsoft Entra join** — supported for AVD in Gov and reduces management overhead. Validate line-of-business dependencies on Kerberos/NTLM and the FSLogix-on-Azure-Files authentication path.
- **Hybrid / AD DS join** — most GCC High estates require **Active Directory Domain Services** (self-managed AD or **Microsoft Entra Domain Services**) for FSLogix, Group Policy, and legacy application authentication. Confirm Entra Domain Services availability in the target Gov regions.
- **Kerberos for Azure Files** — FSLogix profile containers on Azure Files require AD DS or Entra Kerberos; validate the authentication path in the Gov cloud.

### Multi-tenant and cross-cloud considerations
Cross-tenant and cross-cloud collaboration (commercial to GCC High) is restricted. B2B guest flows, Entra External ID, and cross-tenant synchronisation are subject to Gov-specific limits. Where users reside in a commercial tenant and AVD resides in GCC High, the design typically requires separate identities or a scoped cross-tenant access configuration; commercial B2B behaviour cannot be assumed.

### Baseline access controls
- **Conditional Access** — device compliance, phishing-resistant MFA (FIDO2 / CAC-PIV), US named locations, and session controls for the AVD web client.
- **Privileged Identity Management (PIM)** and role-based access separated between platform and workload.
- **Least privilege** across the AVD RBAC surface (host pool, workspace, application group).
`,
    references: [
      { title: "AVD — identity & authentication", url: "https://learn.microsoft.com/en-us/azure/virtual-desktop/authentication", note: "Supported identity/join scenarios." },
      { title: "FSLogix profile containers with Azure Files + Entra Kerberos", url: "https://learn.microsoft.com/en-us/azure/virtual-desktop/create-profile-container-azure-ad", note: "Profile auth options." },
      { title: "Entra ID Government — authentication endpoints", url: "https://learn.microsoft.com/en-us/entra/identity-platform/authentication-national-cloud", note: "us-gov endpoints & national cloud auth." },
      { title: "Cross-tenant access & cross-cloud collaboration", url: "https://learn.microsoft.com/en-us/entra/external-id/cross-cloud-settings", note: "Commercial ↔ Gov B2B limits." },
      { title: "Conditional Access design", url: "https://learn.microsoft.com/en-us/entra/identity/conditional-access/concept-conditional-access-policies", note: "Policy building blocks." },
      { title: "Privileged Identity Management", url: "https://learn.microsoft.com/en-us/entra/id-governance/privileged-identity-management/pim-configure", note: "Just-in-time privileged access." }
    ],
    currentState: [
      { id: "idp_today", type: "radio", label: "Primary identity provider today", options: ["Entra ID Government", "Entra ID (commercial)", "On-prem AD DS only", "Hybrid (AD DS + Entra Connect)", "Third-party IdP federated"] },
      { id: "domain_services", type: "checkbox", label: "Directory services present", options: ["Self-managed AD DS on IaaS", "AD DS on-prem (ExpressRoute/VPN)", "Microsoft Entra Domain Services", "None"] },
      { id: "join_model", type: "radio", label: "Current desktop/server join model", options: ["Microsoft Entra join", "Hybrid Entra join", "AD DS domain join", "Workgroup / not joined", "N/A greenfield"] },
      { id: "mfa_today", type: "checkbox", label: "MFA / strong auth in use", options: ["CAC / PIV smartcard", "FIDO2 security keys", "Microsoft Authenticator", "Certificate-based auth", "SMS/voice (legacy)", "None"] },
      { id: "ca_today", type: "checkbox", label: "Existing Conditional Access controls in place", options: ["Named locations (US)", "Device compliance required", "Legacy auth blocked", "Session controls (sign-in frequency)", "Phishing-resistant MFA grant", "None"] },
      { id: "priv_access_today", type: "checkbox", label: "Current privileged access controls", options: ["Standing admin accounts", "PIM (just-in-time)", "Privileged Access Workstations (PAW)", "Break-glass accounts", "None"] },
      { id: "cross_tenant_today", type: "checkbox", label: "Existing cross-tenant / cross-cloud trusts", options: ["B2B guests", "Cross-tenant sync", "Gov\u2194commercial federation", "None"] },
      /* --- Azure WAF for AVD assessment (GCC High-framed, from WAF AVD workload CSV) --- */
      { id: "waf_rbac", type: "checkbox", label: "RBAC & security groups — do you separate duties and limit access to AVD resources?", help: "GCC High first: delegate roles within the Gov tenant and management-group boundary. AVD second: separate management of host pools, application groups, and workspaces.", options: ["We define roles for the teams and individuals who manage Azure Virtual Desktop deployments.", "We define Azure built-in roles to separate management responsibilities for host pools, application groups, and workspaces.", "We create a security group for each role.", "None of the above"] },
      { id: "waf_iam_strategy", type: "checkbox", label: "IAM strategy — what is your identity and access management strategy for AVD?", help: "GCC High first: use Entra ID Government identities, phishing-resistant MFA (CAC/PIV), and Conditional Access scoped to US named locations. AVD second: least-privilege domain-join account and MFA for all users and admins.", options: ["We create a dedicated user account with least privileges. When we deploy session hosts, we use this account to join the session hosts to a Microsoft Entra Domain Services or Active Directory Domain Services (AD DS) domain.", "We require multifactor authentication for all users and admins in Azure Virtual Desktop.", "We use Microsoft Entra ID Conditional Access to manage risks before we grant users access to our Azure Virtual Desktop environment.", "None of the above"] }
    ],
    toBeState: [
      { id: "target_idp", type: "radio", label: "Target primary identity provider", default: "Entra ID Government", help: "Prefilled — in GCC High the identity provider is Microsoft Entra ID Government. Change only if federating a third-party IdP.", options: ["Entra ID Government", "Entra ID (commercial)", "On-prem AD DS only", "Hybrid (AD DS + Entra Connect)", "Third-party IdP federated"] },
      { id: "target_directory_services", type: "checkbox", label: "Target directory services", inheritFrom: "domain_services", help: "Prefilled from current state (assumed unchanged). Adjust if the target directory posture differs.", options: ["Self-managed AD DS on IaaS", "AD DS on-prem (ExpressRoute/VPN)", "Microsoft Entra Domain Services", "None"] },
      { id: "target_join", type: "radio", label: "Target session-host join model", options: ["Microsoft Entra join", "Hybrid Entra join", "AD DS domain join", "Undecided — needs POC"] },
      { id: "target_profile_auth", type: "radio", label: "Target FSLogix profile auth path", options: ["Azure Files + AD DS Kerberos", "Azure Files + Entra Kerberos", "Azure NetApp Files + AD DS", "Cloud Cache", "Undecided"] },
      { id: "target_mfa", type: "checkbox", label: "Target strong-auth methods", options: ["CAC / PIV", "FIDO2", "Passkeys", "Certificate-based auth", "Authenticator (phishing-resistant only)"] },
      { id: "target_ca_policies", type: "checkbox", label: "Target Conditional Access policies for AVD", options: ["Require compliant device", "Require phishing-resistant MFA", "Restrict to US named locations", "Block legacy auth", "Sign-in risk gate", "Session sign-in frequency"] },
      { id: "target_pim", type: "radio", label: "Privileged access target", options: ["PIM JIT for all admin roles", "PIM + PAW for tier-0", "Standing least-privilege (no PIM)", "TBD"] },
      { id: "target_multitenant_model", type: "select", label: "Target multi-tenant identity model", options: ["Single Gov tenant", "Separate identities per tenant", "Cross-tenant access configuration", "B2B into Gov tenant", "TBD"] },
      { id: "target_commercial_access", type: "text", label: "How commercial users reach the Gov AVD", placeholder: "e.g., separate Gov account; B2B guest; N/A" },
      { id: "rbac_hostpool_owner", type: "text", label: "Host-pool admin owner", placeholder: "Team / role" },
      { id: "rbac_workspace_owner", type: "text", label: "Workspace admin owner", placeholder: "Team / role" },
      { id: "rbac_appgroup_owner", type: "text", label: "App-group admin owner", placeholder: "Team / role" },
      { id: "rbac_platform_separation", type: "select", label: "Platform vs workload RBAC separation", options: ["Fully separated", "Partially separated", "Combined", "TBD"] }
    ]
  },

  /* ======================================================================= *
   * 2. NETWORK
   * ======================================================================= */
  {
    id: "network",
    order: 2,
    title: "Network Topology & Connectivity",
    short: "Network",
    minutes: 30,
    icon: "◇",
    tagline: "Hub-spoke vs. Virtual WAN, private endpoints, RDP Shortpath, egress control, and Gov-region reachability.",
    intro: `
## Design area: Network Topology & Connectivity

The AVD control plane is a Microsoft-managed reverse-connect service: session hosts establish outbound connections and no inbound RDP is exposed. The network design must provide session hosts with reliable, policy-controlled egress to the AVD Gov service tags, identity, profile storage, and on-premises resources.

### Topology
- **Hub-spoke (Azure Firewall)** or **Virtual WAN (secured hub)** are both valid enterprise-scale patterns. In GCC High, confirm Virtual WAN and Firewall SKU availability in the target Gov region.
- The **AVD spoke** hosts the session-host subnets, sized for scale (address space and a subnet per host pool for isolation).
- **Private connectivity to on-premises** uses **ExpressRoute (Gov peering)** or site-to-site VPN, frequently terminating on enclave networks with mandatory inspection.

### Controlled egress
- Route session-host egress through **Azure Firewall** with the AVD Gov service tags and required-FQDN allow-list. The required-URL list differs in Gov and must be validated against the Gov-specific documentation.
- Apply forced tunnelling or egress inspection in line with the SSP, including web content filtering where required.

### Private endpoints and Private Link
- **AVD private endpoints** (feed and connection) remove public control-plane exposure where required.
- **Private endpoints** for storage (FSLogix), Key Vault, and any PaaS dependency of the image. Confirm Private Link availability per service in Gov.

### Performance
- **RDP Shortpath** (managed and public networks) provides UDP transport; validate firewall/NAT rules and Gov support.
- Place session hosts in the Gov region closest to users and the ExpressRoute circuit to reduce latency.
`,
    references: [
      { title: "AVD — required URLs / service tags", url: "https://learn.microsoft.com/en-us/azure/virtual-desktop/safe-url-list", note: "Includes the Azure Government URL list." },
      { title: "AVD network connectivity (reverse connect)", url: "https://learn.microsoft.com/en-us/azure/virtual-desktop/network-connectivity", note: "Reverse-connect transport model." },
      { title: "RDP Shortpath", url: "https://learn.microsoft.com/en-us/azure/virtual-desktop/rdp-shortpath", note: "UDP transport for managed/public networks." },
      { title: "AVD private link", url: "https://learn.microsoft.com/en-us/azure/virtual-desktop/private-link-overview", note: "Private control-plane connectivity." },
      { title: "CAF — network topology & connectivity", url: "https://learn.microsoft.com/en-us/azure/cloud-adoption-framework/ready/landing-zone/design-area/network-topology-and-connectivity", note: "Hub-spoke vs vWAN decisioning." },
      { title: "Azure Government — ExpressRoute", url: "https://learn.microsoft.com/en-us/azure/azure-government/documentation-government-plan-network-architecture", note: "Gov peering & connectivity." }
    ],
    currentState: [
      { id: "net_topology_today", type: "radio", label: "Current Azure network topology", options: ["None (greenfield)", "Single VNet / flat", "Hub-spoke (NVA/Azure Firewall)", "Virtual WAN", "Third-party NVA"] },
      { id: "onprem_conn", type: "checkbox", label: "On-prem / enclave connectivity today", options: ["ExpressRoute (Gov)", "Site-to-site VPN", "SCIF / air-gapped enclave", "None"] },
      { id: "egress_control", type: "checkbox", label: "Current egress control & inspection", options: ["Azure Firewall", "Third-party NVA", "Forced tunneling", "Explicit proxy", "TLS inspection", "FQDN allow-listing", "None"] },
      { id: "ip_space", type: "text", label: "RFC1918 ranges reserved for AVD spokes (comma-separated)", placeholder: "e.g., 10.20.0.0/16" },
      { id: "ip_overlap_risk", type: "select", label: "Overlap risk with on-prem / enclave", options: ["No overlap", "Possible overlap", "Known overlap", "Unknown"] },
      { id: "dns_today", type: "checkbox", label: "Current DNS design", options: ["Azure Private DNS zones", "On-prem DNS forwarders", "Conditional forwarding for Gov endpoints", "Azure DNS Private Resolver", "None"] },
      { id: "private_endpoints_today", type: "checkbox", label: "Private endpoints already used for", options: ["Storage", "Key Vault", "AVD control plane", "Other PaaS", "None"] },
      /* --- Azure WAF for AVD assessment (GCC High-framed, from WAF AVD workload CSV) --- */
      { id: "waf_net_infra", type: "checkbox", label: "Network infrastructure — how have you designed for reliable, low-latency connectivity for distributed clients?", help: "GCC High first: estimate latency to US Gov Virginia/Arizona and to enclave/on-prem networks over ExpressRoute (Gov peering). AVD second: use the Experience Estimator and test on-prem latencies.", options: ["We use the Azure Virtual Desktop Experience Estimator tool to gather estimated latency values.", "We test latencies from our Azure virtual networks to our on-premises systems.", "None of the above"] },
      { id: "waf_vpn", type: "checkbox", label: "VPN clients — do any clients use a VPN to connect to your virtual network?", help: "GCC High first: validate split-tunnel and RDP Shortpath support over ExpressRoute (Gov) or VPN into the Gov boundary. AVD second: client VPN and Shortpath connectivity.", options: ["We have clients who use a point-to-site (P2S) VPN connection, and we use a split tunnel that's based on User Datagram Protocol (UDP).", "We use Remote Desktop Protocol (RDP) Shortpath with a managed network for on-site clients who use a VPN or Azure ExpressRoute.", "None of the above"] },
      { id: "waf_hybrid_net", type: "checkbox", label: "Hybrid networking — are you aware of connectivity options and their performance impact?", help: "GCC High first: avoid IP overlap with on-prem/enclave ranges and size subnets for Gov-region growth. AVD second: hybrid connectivity best practices and per-landing-zone VNet/subnet design.", options: ["We've reviewed best practices for connecting Azure virtual networks to on-premises systems.", "We've tested latencies from our Azure virtual networks to our on-premises systems.", "We've ensured that no overlapping IP addresses are used in our Azure Virtual Desktop landing zone.", "We've given every Azure Virtual Desktop landing zone its own virtual network and subnet configuration.", "We considered potential growth when we sized our Azure Virtual Desktop subnets.", "None of the above"] },
      { id: "waf_multiregion_net", type: "checkbox", label: "Multiple regions — are you aware of networking factors that impact the architecture?", help: "GCC High first: replicate platform and shared services across US Gov regions where policy allows. AVD second: accelerated networking, latency estimation, and bandwidth planning.", options: ["We replicate platform and shared services to each region whenever our internal policies allow it.", "When possible, we use virtual machine (VM) SKUs that offer the accelerated networking feature.", "We include end-user latency estimations in our region selection process.", "When we estimate bandwidth requirements, we take workload types into account, and we monitor real-user connections.", "None of the above"] },
      { id: "waf_net_security", type: "checkbox", label: "Network security — what measures have you implemented and how do you implement network security in AVD?", help: "GCC High first: use the Azure Government required-URL list and service tags; confirm Azure Firewall and Private Link availability in Gov; block direct RDP and use Azure Bastion. AVD second: hub-spoke isolation, NSG/ASG segmentation, host-pool isolation, forced tunneling, private endpoints/Private Link, and web filtering.", options: ["We use a hub-spoke architecture that separates workload resources from hub shared services (management, DNS).", "We use network security groups (NSGs) and application security groups (ASGs) to segment and filter AVD traffic.", "We isolate each host pool in its own subnet/virtual network with the required AVD URLs.", "We use service tags instead of specific IP addresses for Azure services.", "We're familiar with the required URLs for Azure Virtual Desktop.", "We use Azure Firewall to protect AVD and understand the configurations it requires.", "We use forced tunneling with a route table that lets AVD traffic bypass the forced-tunnel rule.", "We use Azure Firewall or NVA web filtering for session-host internet access.", "We use private endpoints for PaaS (Azure Files, Key Vault) and are aware of their cost.", "We use Azure Private Link for the AVD control plane and disable public endpoints.", "We block or disable direct RDP to session hosts and use Azure Bastion for admin access.", "We use a VPN or Azure ExpressRoute for Remote Desktop client connectivity.", "We use Active Directory Domain Services (AD DS) with strict firewall policies for required domain traffic.", "We rigorously enforce network and application security.", "None of the above"] },
      { id: "waf_name_resolution", type: "checkbox", label: "Name resolution — are you familiar with AVD name resolution requirements?", help: "GCC High first: resolve Gov private-endpoint zones and control-plane names within the boundary. AVD second: Private Link and DNS configuration for private endpoints.", options: ["We understand how Azure Private Link works with Azure Virtual Desktop.", "We understand the Domain Name System (DNS) configurations that are needed for Azure private endpoints.", "None of the above"] },
      { id: "waf_rdp_shortpath", type: "checkbox", label: "RDP Shortpath — do you use a UDP-based connection between clients and session hosts?", help: "GCC High first: confirm RDP Shortpath support and charges in Azure Government. AVD second: UDP transport to improve latency and end-user experience.", options: ["To help improve latency and our end-user experience, we use RDP Shortpath.", "We're aware of the availability of RDP Shortpath connection models.", "We're aware of RDP Shortpath charges.", "None of the above"] },
      { id: "waf_deployment_regions", type: "checkbox", label: "Deployment regions — what factors do you consider when selecting AVD deployment regions?", help: "GCC High first: confirm VM SKU/service and AVD management-plane availability in US Gov regions, plus compliance and data-residency requirements. AVD second: co-locate resources with the host pool to minimize latency and egress cost.", options: ["We check that the virtual machine (VM) SKUs and Azure services that we need are available in our selected region.", "Before we select a region, we familiarize ourselves with its compliance and data residency requirements.", "To minimize latency and reduce data transfer costs, we place our resources in the same Azure region as our host pool.", "We familiarize ourselves with the regions that Azure Virtual Desktop management plane resources are available in.", "None of the above"] }
    ],
    toBeState: [
      { id: "target_topology", type: "radio", label: "Target network topology", options: ["Hub-spoke + Azure Firewall", "Virtual WAN secured hub", "Hub-spoke + third-party NVA", "TBD after POC"] },
      { id: "target_region", type: "checkbox", label: "Target Gov region(s) for session hosts", options: ["US Gov Virginia", "US Gov Arizona", "US Gov Texas", "Other/DoD region"] },
      { id: "target_egress_device", type: "select", label: "Target egress control point", options: ["Azure Firewall", "Third-party NVA", "Virtual WAN secured hub", "TBD"] },
      { id: "target_force_tunnel", type: "radio", label: "Force-tunnel decision", options: ["Force-tunnel all egress", "Selective (AVD bypass via route table)", "No force-tunnel", "TBD"] },
      { id: "target_web_filtering", type: "select", label: "Web content filtering", options: ["Azure Firewall web categories", "NVA web filtering", "None", "TBD"] },
      { id: "target_tls_inspection", type: "select", label: "Egress TLS inspection", options: ["Full inspection", "Selective", "None", "TBD"] },
      { id: "target_shortpath", type: "radio", label: "RDP Shortpath target", options: ["Managed networks (private)", "Public networks", "Both", "Not using / TCP only"] },
      { id: "target_private_link", type: "checkbox", label: "Private endpoints to deploy", options: ["AVD feed/connection", "Storage (FSLogix)", "Key Vault", "Azure NetApp Files", "Other PaaS"] },
      { id: "target_dns", type: "checkbox", label: "Target DNS architecture", options: ["Azure Private DNS zones", "Azure DNS Private Resolver", "Split-horizon", "Gov private-endpoint zones", "On-prem forwarders"] },
      { id: "target_subnet_model", type: "select", label: "Subnet model", options: ["Subnet per host pool", "Shared AVD subnet", "Per-classification subnet", "TBD"] },
      { id: "target_subnet_sizing", type: "text", label: "Address sizing for peak scale", placeholder: "e.g., /22 per host-pool subnet for 1,000 hosts" },
      { id: "target_nsg_asg", type: "select", label: "NSG/ASG segmentation strategy", options: ["NSG + ASG per host pool", "NSG only", "Firewall-enforced (no NSG)", "TBD"] }
    ]
  },

  /* ======================================================================= *
   * 3. INFORMATION SECURITY & COMPLIANCE
   * ======================================================================= */
  {
    id: "infosec",
    order: 3,
    title: "Information Security & Compliance",
    short: "InfoSec",
    minutes: 30,
    icon: "▣",
    tagline: "CMMC/NIST 800-171 mapping, Defender for Cloud, encryption/keys, session-host hardening, and DLP.",
    intro: `
## Design area: Security, Governance & Compliance

The security design must be traceable to controls: **NIST SP 800-171 / 800-53**, **CMMC L2**, **FedRAMP High**, and **DoD IL4/IL5**. Each decision maps to a control family and feeds the **System Security Plan (SSP)**.

### Platform guardrails
- **Azure Policy** (through management groups) enforces allowed regions (Gov only), required encryption, denial of public IPs on session hosts, required tags, and diagnostic settings. The **AVD landing-zone policy set** provides a baseline.
- **Microsoft Defender for Cloud** with the **regulatory compliance dashboard** mapped to the applicable frameworks. Confirm which built-in initiatives are available in Gov.
- **Defender for Servers** on session hosts provides EDR, vulnerability assessment, and just-in-time access for management endpoints.

### Data protection
- **Encryption at rest** — platform-managed keys or **customer-managed keys (CMK)** in **Key Vault**. Confirm Managed HSM and FIPS 140-2/3 requirements for IL5.
- **CUI handling** — screen capture protection, clipboard/drive/printer redirection restrictions via AVD RDP properties, watermarking, and **Microsoft Purview** DLP where available in Gov.
- **Image hardening** — STIG or CIS baselines, application control (WDAC/AppLocker), and Defender antivirus policy.

### Identity and security intersection
- Conditional Access and PIM (defined in the Identity module) are security controls and are referenced here.
- **Just-in-time** and **break-glass** procedures are documented for audit.
`,
    references: [
      { title: "Azure Government — Impact Level 5 isolation", url: "https://learn.microsoft.com/en-us/azure/azure-government/documentation-government-impact-level-5", note: "IL5 configuration guidance." },
      { title: "CMMC offering (Azure compliance)", url: "https://learn.microsoft.com/en-us/azure/compliance/offerings/offering-cmmc", note: "CMMC mapping resources." },
      { title: "Microsoft Defender for Cloud — regulatory compliance", url: "https://learn.microsoft.com/en-us/azure/defender-for-cloud/regulatory-compliance-dashboard", note: "Map controls to posture." },
      { title: "AVD — screen capture protection & redirection", url: "https://learn.microsoft.com/en-us/azure/virtual-desktop/screen-capture-protection", note: "Data-exfiltration controls." },
      { title: "Customer-managed keys / Key Vault", url: "https://learn.microsoft.com/en-us/azure/virtual-machines/disk-encryption", note: "CMK for disks & storage." },
      { title: "AVD security best practices", url: "https://learn.microsoft.com/en-us/azure/virtual-desktop/security-guide", note: "Session-host hardening baseline." }
    ],
    currentState: [
      { id: "control_frameworks", type: "checkbox", label: "Control frameworks you must satisfy", options: ["NIST SP 800-171", "NIST SP 800-53", "CMMC L2", "FedRAMP High", "DoD IL4", "DoD IL5", "CJIS", "Other"] },
      { id: "ssp_state", type: "select", label: "SSP / control documentation maturity", options: ["None", "Partial / in draft", "Complete for on-prem", "Complete & inherited to cloud"] },
      { id: "defender_today", type: "checkbox", label: "Defender / posture tooling today", options: ["Defender for Cloud", "Defender for Servers", "Defender for Endpoint", "Third-party EDR", "Vulnerability scanner", "None"] },
      { id: "encryption_keys_today", type: "select", label: "Current encryption key model", options: ["Platform-managed keys", "CMK in Key Vault", "CMK in Managed HSM", "Mixed", "Unknown"] },
      { id: "fips_status_today", type: "select", label: "FIPS 140 validation status", options: ["FIPS 140-2", "FIPS 140-3", "Not validated", "Unknown"] },
      { id: "hardening_baseline_today", type: "select", label: "Current OS hardening baseline", options: ["DISA STIG", "CIS Benchmark", "Custom baseline", "None", "Unknown"] },
      { id: "app_control_today", type: "checkbox", label: "Application control in use", options: ["WDAC", "AppLocker", "None"] },
      { id: "av_today", type: "select", label: "Antivirus / EDR in use", options: ["Defender Antivirus", "Defender for Endpoint", "Third-party", "None"] },
      { id: "patch_cadence_today", type: "text", label: "Patch cadence", placeholder: "e.g., monthly Patch Tuesday + emergency" },
      { id: "dlp_today", type: "checkbox", label: "Current data-exfiltration controls", options: ["Clipboard redirection restricted", "Drive redirection restricted", "Printer/USB redirection restricted", "Screen capture protection", "Watermarking", "Purview DLP", "None"] },
      { id: "audit_scope_today", type: "checkbox", label: "Current audit logging scope", options: ["Sign-in / audit logs", "Session-host security events", "Diagnostic logs", "Network logs", "None"] },
      { id: "audit_retention_today", type: "text", label: "Log retention period", placeholder: "e.g., 365 days / 7 years" },
      { id: "audit_siem_today", type: "select", label: "SIEM integration", options: ["Microsoft Sentinel", "Third-party SIEM", "None", "Unknown"] },
      /* --- Azure WAF for AVD assessment (GCC High-framed, from WAF AVD workload CSV) --- */
      { id: "waf_session_host_security", type: "checkbox", label: "Session-host security — what measures improve the security of your session hosts?", help: "GCC High first: apply STIG/CIS hardening required by the ATO and CUI-handling controls. AVD second: AppLocker/WDAC, screen-capture protection, watermarking, Defender AV, inactivity sign-out, and CSPM.", options: ["We restrict Windows Explorer access by hiding local and remote drive mappings to help prevent users from discovering sensitive information.", "We use AppLocker to prevent unwanted software from running on session hosts.", "We use screen capture protection and watermarking to help prevent sensitive information from being captured on client endpoints.", "We use Microsoft Defender Antivirus to help protect our virtual machines (VMs).", "We use Windows Defender Application Control, and we define policies for all our drivers and applications.", "We sign out users when they're inactive to preserve resources and prevent unauthorized access.", "We use Microsoft Defender for Cloud for cloud security posture management (CSPM).", "None of the above"] },
      { id: "waf_encrypt_transit", type: "checkbox", label: "Encryption in transit — how do you encrypt data in transit in AVD?", help: "GCC High first: confirm TLS 1.2 ciphers and reverse-connect transport behavior in Azure Government. AVD second: understand AVD data-in-transit encryption.", options: ["We understand how Azure Virtual Desktop encrypts data in transit and how reverse connect transport works.", "We've made sure that client computers and our session hosts can use the TLS 1.2 ciphers that Azure Front Door uses.", "None of the above"] },
      { id: "waf_encrypt_use", type: "checkbox", label: "Encryption in use — how do you encrypt data in use in AVD?", help: "GCC High first: confirm confidential VM (DCasv5/ECasv5) availability in US Gov regions for IL5 / high-classification data-in-use protection. AVD second: hardware-based trusted execution environment.", options: ["We use confidential computing to protect data in use.", "We use the Azure DCasv5 and ECasv5 confidential VM series to build a hardware-based trusted execution environment (TEE).", "None of the above"] },
      { id: "waf_security_posture", type: "checkbox", label: "Security posture — what measures strengthen the security posture of your environment?", help: "GCC High first: confirm which Defender for Cloud regulatory initiatives (NIST 800-171/53, FedRAMP High, CMMC) are available in Gov and retain logs inside the boundary. AVD second: vulnerability management, Entra logs, and compliance reporting.", options: ["We use Microsoft Defender for Cloud to manage vulnerabilities and to assess compliance with common frameworks.", "We use Defender for Cloud to strengthen the overall security posture of our environment.", "We collect Microsoft Entra ID authentication and audit logs.", "We store security event logs from our Azure Virtual Desktop session hosts in a repository.", "We update our Azure Virtual Desktop environment regularly.", "We conduct monthly compliance reporting.", "None of the above"] }
    ],
    toBeState: [
      { id: "target_policy_baseline", type: "radio", label: "Azure Policy guardrail baseline", options: ["AVD landing-zone policy set", "Custom initiative mapped to 800-171", "Regulatory built-ins (Defender)", "Combination", "TBD"] },
      { id: "target_compliance_dash", type: "checkbox", label: "Regulatory initiatives to enable in Defender", options: ["NIST 800-171", "NIST 800-53", "FedRAMP High", "CMMC", "Azure Security Benchmark"] },
      { id: "target_cmk", type: "radio", label: "Key management target", options: ["Platform-managed keys", "CMK in Key Vault", "CMK in Managed HSM (FIPS 140-3)", "TBD by data classification"] },
      { id: "target_exfil", type: "checkbox", label: "Data-exfiltration controls to enforce", options: ["Disable clipboard out", "Disable drive redirection", "Disable printer/USB", "Screen capture protection", "Watermarking", "Purview DLP"] },
      { id: "target_hardening_baseline", type: "select", label: "Target hardening baseline", options: ["DISA STIG", "CIS Benchmark", "Custom mapped to 800-171", "TBD"] },
      { id: "target_app_control", type: "radio", label: "Target application control", options: ["WDAC", "AppLocker", "WDAC + AppLocker", "None", "TBD"] },
      { id: "target_edr", type: "select", label: "Target AV / EDR policy", options: ["Defender for Endpoint", "Defender Antivirus only", "Third-party", "TBD"] },
      { id: "target_patch_strategy", type: "text", label: "Patch / update strategy", placeholder: "e.g., golden-image rebuild monthly + update rings" },
      { id: "target_control_mapping", type: "text", label: "Control-to-design traceability approach", placeholder: "e.g., decisions tagged to 800-171 families in SSP appendix" },
      { id: "target_siem", type: "select", label: "Target SIEM", options: ["Microsoft Sentinel (Gov)", "Third-party SIEM", "Log Analytics only", "TBD"] },
      { id: "target_alert_routing", type: "text", label: "Alert routing / on-call", placeholder: "e.g., SOC queue + Teams channel" },
      { id: "target_playbooks", type: "select", label: "Automated response playbooks", options: ["Sentinel playbooks (SOAR)", "Manual runbooks", "None", "TBD"] },
      { id: "target_retention", type: "text", label: "Retention / immutability target", placeholder: "e.g., 2 years immutable" }
    ]
  },

  /* ======================================================================= *
   * 4. PLATFORM AUTOMATION & DEVOPS
   * ======================================================================= */
  {
    id: "platform",
    order: 4,
    title: "Platform Automation & DevOps",
    short: "Platform",
    minutes: 30,
    icon: "▤",
    tagline: "IaC, image factory, host-pool lifecycle, management groups, and Gov-aware pipelines.",
    intro: `
## Design area: Platform Automation & DevOps

The enterprise-scale landing zone is declarative and repeatable. For AVD on GCC High this requires infrastructure as code that targets the US Gov cloud, an image build process, and controlled host-pool lifecycle automation.

### Management group and subscription design
- A **management group hierarchy** (Platform / Landing Zones / Sandbox) with the AVD workload under a landing-zone management group so policy inherits downward.
- Subscription strategy separates **platform** subscriptions (connectivity, identity, management) from **AVD workload** subscriptions, with per-classification isolation where required.

### Infrastructure as Code
- **Bicep** (using the AVD accelerator modules) or **Terraform** (AzureRM provider set to \`environment = "usgovernment"\`). Validate that every resource and SKU exists in Gov before committing.
- Store state within the Gov boundary (Gov storage backend for Terraform). No state resides in the commercial cloud.

### Image build process
- **Azure Compute Gallery** in Gov with versioned images replicated across Gov regions.
- Build pipeline using **Azure VM Image Builder** or **Packer** with a DevOps pipeline: apply STIG/CIS baselines, install FSLogix, line-of-business applications, and Defender, then generalise.

### Host-pool lifecycle
- **Scaling plans** (native autoscale) for pooled and personal host pools; validate autoscale availability in Gov.
- Drain and rollover automation for patch cycles, following a golden-image-to-new-session-host sequence with drain of prior hosts.
- Pipelines run on self-hosted agents inside the Gov boundary; no commercial-hosted runners process Gov data.
`,
    references: [
      { title: "AVD landing zone accelerator (Bicep/Terraform)", url: "https://learn.microsoft.com/en-us/azure/cloud-adoption-framework/scenarios/wvd/enterprise-scale-landing-zone", note: "Reference IaC for AVD." },
      { title: "Terraform AzureRM — US Government cloud", url: "https://learn.microsoft.com/en-us/azure/developer/terraform/", note: "environment=usgovernment configuration." },
      { title: "Azure Compute Gallery", url: "https://learn.microsoft.com/en-us/azure/virtual-machines/azure-compute-gallery", note: "Versioned, replicated images." },
      { title: "Azure VM Image Builder", url: "https://learn.microsoft.com/en-us/azure/virtual-machines/image-builder-overview", note: "Automated image factory." },
      { title: "AVD autoscale scaling plans", url: "https://learn.microsoft.com/en-us/azure/virtual-desktop/autoscale-scaling-plan", note: "Native host-pool scaling." },
      { title: "CAF — management group & subscription org", url: "https://learn.microsoft.com/en-us/azure/cloud-adoption-framework/ready/landing-zone/design-area/resource-org", note: "MG hierarchy design." }
    ],
    currentState: [
      { id: "iac_today", type: "radio", label: "Current IaC maturity", options: ["Manual / portal only", "Scripts (PowerShell/CLI)", "ARM templates", "Bicep", "Terraform", "Mixed"] },
      { id: "mg_today", type: "select", label: "Existing management group hierarchy", options: ["None (root only)", "Basic (1-2 levels)", "CAF-aligned hierarchy", "Unknown"] },
      { id: "sub_boundaries_today", type: "text", label: "Subscription boundaries (comma-separated)", placeholder: "e.g., platform, AVD-prod, AVD-dev" },
      { id: "sub_owner_today", type: "text", label: "Subscription owner(s)", placeholder: "Team / role" },
      { id: "image_method_today", type: "select", label: "Current image build method", options: ["Manual golden image", "Packer", "Azure VM Image Builder", "Marketplace only", "None"] },
      { id: "image_storage_today", type: "select", label: "Image storage location", options: ["Azure Compute Gallery (Gov)", "Managed image", "Storage account", "On-prem", "None"] },
      { id: "image_versioning_today", type: "select", label: "Image versioning", options: ["Versioned in Compute Gallery", "Ad-hoc / manual", "None"] },
      { id: "pipeline_tool_today", type: "select", label: "Current CI/CD tool", options: ["Azure DevOps (Gov)", "Azure DevOps (commercial)", "GitHub", "Jenkins", "None", "Other"] },
      { id: "pipeline_agents_today", type: "select", label: "Where build agents run", options: ["Self-hosted inside Gov boundary", "Microsoft-hosted (commercial)", "On-prem", "None", "Unknown"] },
      { id: "hostpool_ops_today", type: "checkbox", label: "Current host-pool operations in place", options: ["Scheduled patching", "Image refresh process", "Autoscale / scaling", "Drain & rollover procedure", "None"] },
      { id: "state_mgmt_today", type: "select", label: "IaC state / config storage location", options: ["N/A", "Commercial storage", "Gov storage", "On-prem", "Unknown"] },
      /* --- Azure WAF for AVD assessment (GCC High-framed, from WAF AVD workload CSV) --- */
      { id: "waf_update_hostpool", type: "checkbox", label: "Host-pool VM updates — how do you update your host pool virtual machines?", help: "GCC High first: stage golden-image rollovers within the Gov boundary and validate quota headroom in the target Gov region. AVD second: second host pool for rollback or new-image deployment.", options: ["We prefer to have our initial host pool available for a rollback, so we deploy a second host pool when we update our VMs.", "We can double our number of VMs per host pool, so we update our VMs by deploying new VMs from a new golden image into our host pools.", "None of the above"] },
      { id: "waf_golden_images", type: "checkbox", label: "Golden images — how do you manage golden images?", help: "GCC High first: build images with Gov-hosted pipelines/agents and Key Vault (Gov); keep image artifacts inside the boundary. AVD second: Image Builder, Marketplace, and version-controlled scripts.", options: ["We use Azure VM Image Builder to automate the process of updating golden images.", "We retrieve the latest versions of images from Azure Marketplace.", "We use PowerShell scripts to install applications.", "We use a version control system to manage deployment scripts.", "We use Azure Key Vault to store secrets that our automated deployment processes use.", "None of the above"] },
      { id: "waf_supported_versions", type: "checkbox", label: "Supported versions — how do you ensure the versions you use are supported?", help: "GCC High first: track AVD-in-Azure-Government release notes and Gov feature parity. AVD second: review release notes and install updates.", options: ["We regularly review release notes and other articles about developments in Azure Virtual Desktop components.", "We install updates when they become available.", "None of the above"] },
      { id: "waf_stay_informed", type: "checkbox", label: "Staying informed — how do you stay informed about AVD developments?", help: "GCC High first: monitor Azure Government and AVD-in-Gov what's-new for parity changes. AVD second: track updates, features, and bug fixes.", options: ["We're aware of the latest Azure Virtual Desktop updates, features, feature improvements, and bug fixes.", "We check resources like what's-new articles about Azure Virtual Desktop on a monthly basis.", "None of the above"] },
      { id: "waf_platform_limits", type: "checkbox", label: "Platform limits — what measures prevent components from exceeding platform limits?", help: "GCC High first: Gov vCPU quotas and object limits differ from commercial; request increases early. AVD second: monitor usage, FSLogix IOPS per user, and VM token expiry automation.", options: ["We monitor the resource usage of our components.", "We're aware of system limits on services, Azure objects, and the number of vCPUs that we can create.", "We understand how many I/O operations per second (IOPS) an FSLogix profile requires to support each user.", "We use automation to prevent VM tokens from expiring.", "None of the above"] }
    ],
    toBeState: [
      { id: "target_iac", type: "radio", label: "Target IaC standard", options: ["Bicep (AVD accelerator)", "Terraform (AzureRM Gov)", "Both / module-dependent", "TBD"] },
      { id: "target_mg_hierarchy", type: "select", label: "Target management group hierarchy", options: ["CAF: Platform / Landing Zones / Sandbox", "Custom hierarchy", "Flat", "TBD"] },
      { id: "target_avd_sub_placement", type: "text", label: "Where AVD subscriptions sit", placeholder: "e.g., under Landing Zones > Corp" },
      { id: "target_policy_inheritance", type: "select", label: "Policy inheritance approach", options: ["Inherit from MG root", "Per-landing-zone assignment", "Mixed", "TBD"] },
      { id: "target_image_factory", type: "radio", label: "Target image factory", options: ["Azure VM Image Builder", "Packer + DevOps", "Manual golden image (interim)", "TBD"] },
      { id: "target_gallery_versioning", type: "select", label: "Compute Gallery versioning", options: ["Semantic versioning", "Date-based", "Latest-only", "TBD"] },
      { id: "target_gallery_replication", type: "checkbox", label: "Image replication targets", options: ["US Gov Virginia", "US Gov Arizona", "US Gov Texas", "DoD region"] },
      { id: "target_gallery_rollback", type: "select", label: "Image rollback strategy", options: ["Keep N prior versions", "Parallel host pool rollback", "No rollback", "TBD"] },
      { id: "target_pipeline_tool", type: "select", label: "Target CI/CD tool", options: ["Azure DevOps (Gov)", "GitHub", "Other", "TBD"] },
      { id: "target_pipeline_agents", type: "radio", label: "Agent placement", options: ["Self-hosted inside Gov boundary", "Microsoft-hosted", "TBD"] },
      { id: "target_pipeline_gates", type: "checkbox", label: "Approvals / gates", options: ["Manual approval gate", "Automated tests", "Security scan gate", "Change-control integration"] },
      { id: "target_scaling", type: "radio", label: "Host-pool scaling target", options: ["Native autoscale scaling plans", "Automation runbooks", "Manual", "TBD (validate Gov support)"] },
      { id: "target_image_rollover", type: "select", label: "Golden-image rollover method", options: ["New hosts from new image (drain old)", "In-place update", "Second host pool swap", "TBD"] },
      { id: "target_rollover_cadence", type: "text", label: "Drain / rollover cadence", placeholder: "e.g., monthly" },
      { id: "target_update_rings", type: "select", label: "Update rings", options: ["Pilot \u2192 broad", "Single ring", "None", "TBD"] }
    ]
  },

  /* ======================================================================= *
   * 5. FINOPS & COST
   * ======================================================================= */
  {
    id: "finops",
    order: 5,
    title: "FinOps & Cost Management",
    short: "FinOps",
    minutes: 30,
    icon: "◧",
    tagline: "Pooled vs. personal sizing, autoscale, reservations and savings plans in Gov, and per-user chargeback.",
    intro: `
## Design area: Cost Management & FinOps

AVD cost is dominated by compute (session hosts) and storage (profiles). In GCC High, pricing differs from commercial and some discount vehicles carry Gov-specific terms; validate every assumption against Gov pricing.

### Primary cost levers
- **Pooled vs. personal** — pooled desktops multiplex multiple users per host for higher density and lower per-user cost; personal desktops are one-to-one and are required for elevated or developer workloads at a higher cost.
- **Autoscale scaling plans** — ramping session hosts down outside business hours is typically the largest single reduction. Model schedules against measured usage.
- **VM SKU right-sizing** — match vCPU, memory, and GPU to the workload. Allocate GPU only where required (CAD, GIS, rendering) and confirm SKU availability in the Gov region.
- **Storage tiering** — FSLogix on Azure Files (Premium or Standard) or Azure NetApp Files, sized against IOPS and cost.

### Commitment discounts
- **Reserved Instances and Savings Plans** for steady-state base capacity; validate Gov availability and terms.
- **Azure Hybrid Benefit** for Windows Server session hosts. Existing M365 or Windows E3/E5 licensing may cover the AVD user access right; confirm Gov licensing.

### Governance
- **Budgets and alerts**, **cost allocation tags** (mission, program, classification), and **chargeback or showback** per business unit.
- Track **cost per user and per concurrent session** as the primary cost KPI.
`,
    references: [
      { title: "AVD — pricing & cost model", url: "https://learn.microsoft.com/en-us/azure/virtual-desktop/prerequisites", note: "License requirements & cost components." },
      { title: "Azure Government pricing", url: "https://azure.microsoft.com/en-us/pricing/", note: "Gov-specific rate cards." },
      { title: "Autoscale scaling plans (cost lever)", url: "https://learn.microsoft.com/en-us/azure/virtual-desktop/autoscale-scaling-plan", note: "Off-hours ramp-down savings." },
      { title: "Azure Hybrid Benefit", url: "https://learn.microsoft.com/en-us/azure/virtual-machines/windows/hybrid-use-benefit-licensing", note: "Windows Server licensing offset." },
      { title: "Cost Management + budgets", url: "https://learn.microsoft.com/en-us/azure/cost-management-billing/costs/tutorial-acm-create-budgets", note: "Budgets, alerts, allocation." },
      { title: "WAF — Cost Optimization pillar", url: "https://learn.microsoft.com/en-us/azure/well-architected/cost-optimization/", note: "Cost design principles." }
    ],
    currentState: [
      { id: "cost_annual_today", type: "text", label: "Current annual VDI/desktop spend", placeholder: "e.g., $1.2M/yr" },
      { id: "cost_per_user_today", type: "text", label: "Current per-user cost", placeholder: "e.g., $85/user/month" },
      { id: "hardware_refresh_today", type: "text", label: "Hardware refresh cycle", placeholder: "e.g., 4-year laptop refresh" },
      { id: "licensing_today", type: "checkbox", label: "Licensing entitlements held", options: ["M365 E3", "M365 E5", "Windows E3/E5", "Windows Server (SA)", "RDS CALs", "Unknown"] },
      { id: "commitment_today", type: "checkbox", label: "Existing commitment discounts", options: ["Reserved Instances", "Savings Plans", "Azure Hybrid Benefit", "EA/MCA discount", "None"] },
      { id: "cost_budgets_today", type: "select", label: "Budgets & alerts in place", options: ["Yes — budgets + alerts", "Budgets only", "None", "Unknown"] },
      { id: "cost_tagging_today", type: "select", label: "Cost allocation tagging", options: ["Enforced tag taxonomy", "Partial tagging", "None"] },
      { id: "cost_chargeback_today", type: "select", label: "Showback / chargeback", options: ["Chargeback", "Showback", "None"] },
      { id: "cost_owner_today", type: "text", label: "Cost accountability owner", placeholder: "Team / role" },
      { id: "usage_hours", type: "select", label: "Operating hours pattern", options: ["Business hours (single shift)", "Multi-shift", "24x7", "Mixed"] },
      { id: "usage_concurrency", type: "text", label: "Peak concurrency", placeholder: "e.g., 800 concurrent at 10am ET" },
      { id: "usage_seasonality", type: "text", label: "Seasonal peaks", placeholder: "e.g., quarter-end surge; none" },
      /* --- Azure WAF for AVD assessment (GCC High-framed, from WAF AVD workload CSV) --- */
      { id: "waf_host_pool_types", type: "checkbox", label: "Host pool types — have you considered how host pool types affect cost and reliability?", help: "GCC High first: validate host-pool pricing in Azure Government. AVD second: personal vs pooled host-pool cost and reliability trade-offs.", options: ["We use a personal pool to give our users power to personalize their environment and work freely within a virtual machine (VM).", "We use a pooled host pool to streamline our reliability solution and minimize costs.", "None of the above"] },
      { id: "waf_load_balancing", type: "checkbox", label: "Load-balancing algorithm — for pooled host pools, have you considered how it affects cost and performance?", help: "GCC High first: model against Azure Government pricing. AVD second: breadth-first (experience) vs depth-first (cost) and scale-down behavior.", options: ["We use breadth-first load balancing to quickly improve our user experience.", "We use depth-first load balancing to reduce costs.", "For scale-down scenarios, we use depth-first load balancing.", "None of the above"] },
      { id: "waf_scaling_plans", type: "checkbox", label: "Scaling plans — do you use AVD scaling plans for session hosts?", help: "GCC High first: confirm autoscale scaling-plan support in the target Gov region. AVD second: off-hours ramp-down for cost efficiency.", options: ["We use scaling plans to help maximize cost efficiency by automatically turning hosts off and on.", "We adjust the settings of our scaling plans to improve cost efficiency.", "None of the above"] },
      { id: "waf_compute_size", type: "checkbox", label: "Compute size — do you consider the sizes, families, features, and options Azure offers?", help: "GCC High first: confirm SKU family and GPU availability in US Gov regions. AVD second: right-size for performance/cost, DCasv5/ECasv5 for high-security, NV-series for graphics.", options: ["We look at the various compute sizes, families, and features that Azure offers, and we choose the option that optimizes the performance and cost efficiency of our workload.", "For our high-security workloads, we use virtual machines (VMs) in the DCasv5 or ECasv5 series.", "We use graphics-intensive applications, so we use NV-series VMs.", "None of the above"] },
      { id: "waf_storage_perf", type: "checkbox", label: "Storage performance — have you considered how your storage solution affects virtual-desktop performance?", help: "GCC High first: confirm managed-disk types available in Azure Government. AVD second: size for throughput/IOPS and cost efficiency.", options: ["When we design our storage solution, we consider the maximum size, throughput, and I/O operations per second (IOPS) of the various types of Azure managed disks.", "We choose a type of managed disk that optimizes the performance and cost efficiency of our workload.", "None of the above"] },
      { id: "waf_vm_sku_disk", type: "checkbox", label: "VM SKU & disk type — what factors do you consider when selecting a VM SKU and a disk type?", help: "GCC High first: verify SKU and disk-type availability in US Gov regions. AVD second: cores per session model and SSD/premium-SSD selection.", options: ["Before we select a VM SKU, we examine the CPU, GPU, memory, and storage usage of the workloads that our users run.", "For single-session hosts, we use VMs with at least two physical CPU cores.", "For multiple-session hosts, we use VMs with at least four cores.", "We use a larger number of smaller VMs instead of a few large VMs.", "We use scaling plans to adjust our number of VMs based on user demand and schedule.", "When we select a disk type, we take into account the I/O operations per second (IOPS) and throughput performance limits of our VMs.", "For high-performance workloads, we use solid-state drives (SSDs).", "For production workloads that require high performance, low latency, and a service-level agreement (SLA), we use premium SSDs.", "For Windows 10 or Windows 11 Enterprise Multi-Session, we use premium SSDs.", "For personal desktops, we use standard or premium SSDs.", "None of the above"] },
      { id: "waf_fslogix_storage", type: "checkbox", label: "FSLogix storage — which performance, capacity, and infrastructure requirements do you consider before selecting an FSLogix storage solution?", help: "GCC High first: confirm Azure Files and Azure NetApp Files availability and supported protocols in the target Gov region. AVD second: profile-container performance, capacity, and tier selection.", options: ["We deploy our storage solution for FSLogix profile containers in the same region as our session hosts.", "Before we select a storage solution, we check that it supports the protocols that we use.", "In most scenarios, we use Azure Files as our storage solution for FSLogix.", "For I/O-intensive workloads that require high performance and low latency, we use Azure Files premium file shares.", "For I/O workloads that are less sensitive to performance variability, we use Azure Files standard file shares.", "For a pay-as-you-go billing model, we use Azure Files standard file shares.", "For large-scale Azure Virtual Desktop deployments, we use Azure NetApp Files as a storage solution for FSLogix.", "We check that Azure NetApp Files is available in our region.", "We consider performance requirements and costs when we select a tier and provision capacity for Azure NetApp Files.", "We're aware that the capacity that we provision for Azure NetApp Files can affect our choice of tier.", "None of the above"] }
    ],
    toBeState: [
      { id: "target_pct_pooled", type: "text", label: "% pooled host pools", placeholder: "e.g., 70%" },
      { id: "target_pct_personal", type: "text", label: "% personal desktops", placeholder: "e.g., 30%" },
      { id: "target_mix_rationale", type: "text", label: "Personal-pool justification", placeholder: "e.g., developers, elevated workloads" },
      { id: "target_sku_families", type: "text", label: "Target VM SKU families (comma-separated)", placeholder: "e.g., D-series v5, NV-series" },
      { id: "target_users_per_host", type: "text", label: "Users-per-host target", placeholder: "e.g., 6 users/host" },
      { id: "target_gpu_pool", type: "select", label: "GPU pool required?", options: ["No GPU", "NV-series pool (Gov-confirmed)", "NV-series (validate Gov)", "TBD"] },
      { id: "target_autoscale_schedule", type: "text", label: "Autoscale ramp schedule", placeholder: "e.g., ramp-up 6am, ramp-down 8pm ET, weekends off" },
      { id: "target_autoscale_minmax", type: "text", label: "Min / max hosts", placeholder: "e.g., min 2, max 20" },
      { id: "target_autoscale_reduction", type: "text", label: "Expected cost reduction", placeholder: "e.g., ~40%" },
      { id: "target_storage_cost", type: "radio", label: "Target profile storage (cost-driven)", options: ["Azure Files Premium", "Azure Files Standard", "Azure NetApp Files", "Mixed by cohort", "TBD"] },
      { id: "target_commitments", type: "checkbox", label: "Commitment strategy for base capacity", options: ["Reserved Instances", "Savings Plans", "Azure Hybrid Benefit", "None (variable)"] },
      { id: "target_tag_taxonomy", type: "text", label: "Cost allocation tag taxonomy (comma-separated)", placeholder: "e.g., mission, program, classification" },
      { id: "target_chargeback_model", type: "radio", label: "Cost allocation model", options: ["Chargeback", "Showback", "None", "TBD"] },
      { id: "target_cost_kpi", type: "text", label: "Target cost-per-user KPI", placeholder: "e.g., ≤ $X / named user / month" }
    ]
  },

  /* ======================================================================= *
   * 6. MONITORING & RELIABILITY
   * ======================================================================= */
  {
    id: "reliability",
    order: 6,
    title: "Monitoring & Reliability",
    short: "Reliability",
    minutes: 30,
    icon: "◔",
    tagline: "Azure Monitor / Insights for AVD, SLOs, availability zones, BCDR, and capacity resilience.",
    intro: `
## Design area: Management, Monitoring & Reliability

AVD availability depends on the Microsoft-managed control plane, the customer-managed session hosts, and shared dependencies (identity, storage, network). The reliability design must address all three and be fully observable.

### Observability
- **Azure Monitor Agent** and the **AVD Insights** workbook cover connection success, round-trip latency, host performance, FSLogix profile health, and top errors. Confirm **Log Analytics** workspace placement in Gov.
- **Diagnostic settings** on host pools, workspaces, and application groups route to Log Analytics, with alerting on connection failures and capacity.
- **Service Health** and **Resource Health** alerts for the Gov region.

### Availability and resilience
- **Availability zones** distribute session hosts across zones in the Gov region; confirm zone support in the target region.
- **FSLogix resilience** uses Azure Files with ZRS/GRS or Azure NetApp Files cross-region replication. Profile storage is a single point of failure unless designed for redundancy.
- **Host-pool redundancy** provides N+1 capacity across multiple host pools, with a documented capacity and quota posture. Gov vCPU quotas differ from commercial.

### Business continuity and disaster recovery
- **Multi-region** AVD (active/passive) across US Gov Virginia and Arizona, replicating images (Compute Gallery), profiles, and IaC.
- **RTO and RPO** targets defined per user cohort, with documented failover runbooks.
- **Backup** of profiles and personal desktops using Azure Backup or Azure NetApp Files snapshots.
`,
    references: [
      { title: "AVD Insights (Azure Monitor)", url: "https://learn.microsoft.com/en-us/azure/virtual-desktop/insights", note: "Prebuilt monitoring workbook." },
      { title: "AVD business continuity & disaster recovery", url: "https://learn.microsoft.com/en-us/azure/virtual-desktop/disaster-recovery", note: "Multi-region DR patterns." },
      { title: "Availability zones", url: "https://learn.microsoft.com/en-us/azure/reliability/availability-zones-overview", note: "Zone-redundant deployment." },
      { title: "WAF — Reliability pillar", url: "https://learn.microsoft.com/en-us/azure/well-architected/reliability/", note: "SLO & resilience design." },
      { title: "Azure Monitor for Gov", url: "https://learn.microsoft.com/en-us/azure/azure-government/compare-azure-government-global-azure", note: "Feature parity/placement notes." },
      { title: "Azure Backup / ANF snapshots", url: "https://learn.microsoft.com/en-us/azure/backup/backup-overview", note: "Profile & personal-desktop protection." }
    ],
    currentState: [
      { id: "monitoring_tools_today", type: "text", label: "Current monitoring tools (comma-separated)", placeholder: "e.g., SCOM, Nagios, none" },
      { id: "monitoring_metrics_today", type: "checkbox", label: "Metrics watched today", options: ["Logon success", "Latency / RTT", "Host CPU/memory", "Profile health", "None"] },
      { id: "alerting_maturity_today", type: "select", label: "Alerting maturity", options: ["Mature (routed + on-call)", "Basic email alerts", "None"] },
      { id: "slo_today", type: "text", label: "Current availability SLO / experience", placeholder: "e.g., no formal SLO; ~2 outages/quarter" },
      { id: "redundancy_today", type: "select", label: "Current redundancy", options: ["Multi-region", "Multi-zone", "Single-zone", "None"] },
      { id: "profile_backup_today", type: "select", label: "Profile backup today", options: ["Azure Backup", "Snapshots", "File-level backup", "None"] },
      { id: "spof_today", type: "text", label: "Known single points of failure (comma-separated)", placeholder: "e.g., single file server, single broker" },
      { id: "dr_site_today", type: "select", label: "Current DR site", options: ["Secondary Gov region", "Secondary datacenter", "None", "Unknown"] },
      { id: "rto_today", type: "text", label: "Current RTO", placeholder: "e.g., 4 hours" },
      { id: "rpo_today", type: "text", label: "Current RPO", placeholder: "e.g., 24 hours" },
      { id: "dr_last_tested_today", type: "text", label: "DR last tested", placeholder: "e.g., Q1 2026; never" },
      { id: "vcpu_quota_today", type: "text", label: "Known Gov vCPU quota", placeholder: "e.g., 500 vCPU in US Gov Virginia" },
      { id: "gpu_availability_today", type: "select", label: "GPU availability in target Gov region", options: ["Available", "Limited", "Not available", "Unknown"] },
      { id: "capacity_headroom_today", type: "text", label: "Current capacity headroom", placeholder: "e.g., 20% headroom" },
      /* --- Azure WAF for AVD assessment (GCC High-framed, from WAF AVD workload CSV) --- */
      { id: "waf_availability_zones", type: "checkbox", label: "Availability zones/sets — do you place session hosts in availability zones or availability sets?", help: "GCC High first: confirm availability-zone support in the target US Gov region. AVD second: place hosts close to users and across zones/sets to protect against outages.", options: ["To minimize latency, we deploy session hosts close to our users.", "We deploy session hosts in an availability zone or an availability set to help protect our environment from outages.", "None of the above"] },
      { id: "waf_ha_dr", type: "checkbox", label: "High availability & disaster recovery — how do you achieve HA/DR for your workload?", help: "GCC High first: design across US Gov Virginia/Arizona within policy. AVD second: zone spread, golden-image redundancy, backups, and failure-mode analysis.", options: ["We spread session hosts across different availability zones to improve availability.", "We spread out session hosts within availability zones.", "We don't need to back up session host data or applications, so we use golden images that we save in a redundant fashion for disaster recovery.", "We update session host data frequently, so we use backups for disaster recovery.", "We've performed a failure mode analysis on our environment to prepare for outages and help prevent them.", "None of the above"] },
      { id: "waf_service_resource_health", type: "checkbox", label: "Service & Resource Health — do you use them to stay informed about the services, regions, and resources AVD uses?", help: "GCC High first: monitor Azure Government service and region health. AVD second: Service Health, Resource Health, and their alerts.", options: ["We use Service Health to stay informed about the health of the Azure services and regions that we use.", "We set up Service Health alerts so that we stay aware of service issues, planned maintenance, and other changes that might affect our Azure Virtual Desktop resources.", "We use Resource Health to monitor our virtual machines (VMs) and storage solutions.", "We set up Resource Health alerts.", "None of the above"] },
      { id: "waf_performance_monitoring", type: "checkbox", label: "Performance monitoring — how do you monitor the workload, its session hosts, and its storage solution?", help: "GCC High first: place the Log Analytics workspace inside the Gov boundary. AVD second: diagnostics, performance counters, agent event logs, and storage/usage limits.", options: ["We configure diagnostics data to be sent to Log Analytics.", "We select from various options for configuring diagnostics settings, such as an Azure Virtual Desktop Insights configuration workbook, Azure Policy, the Azure portal, and a template.", "We configure performance counters so that we have a record of how our system resources are used.", "We use diagnostics tables in Log Analytics to query and analyze network information for Azure Virtual Desktop connections.", "We monitor event logs for connection problems with the Azure Virtual Desktop agent.", "We monitor the Azure storage solution that we use for hosting FSLogix profiles and App Attach shares.", "We monitor service usage to make sure our workload doesn't exceed limits.", "None of the above"] },
      { id: "waf_reporting_tools", type: "checkbox", label: "Reporting tools — what reporting tools do you use for your workload?", help: "GCC High first: confirm AVD Insights workbook and Resource Graph parity in Azure Government. AVD second: AVD Insights and custom dashboards.", options: ["We use Azure Virtual Desktop Insights for reporting.", "We make custom dashboards, and we use Log Analytics tables and Resource Graph query results as data sources.", "None of the above"] },
      { id: "waf_alerts", type: "checkbox", label: "Alerts — do you use alerts to stay informed about AVD performance and security?", help: "GCC High first: route alerts within the Gov tenant and monitoring stack. AVD second: performance and security alerts across events, diagnostics, and resources.", options: ["We use alerts to stay informed about Azure Virtual Desktop performance and security.", "We configure alerts for various Azure Virtual Desktop events, diagnostics, and resources.", "None of the above"] },
      { id: "waf_bcdr_hostpools", type: "checkbox", label: "BCDR for host pools — how do you implement business continuity and disaster recovery for your host pools?", help: "GCC High first: active/passive across US Gov regions. AVD second: multiple host pools, FSLogix Cloud Cache, and Azure Site Recovery for personal pools.", options: ["We use multiple host pools, because we have distinct sets of users who have different business continuity disaster recovery requirements.", "We have evaluated the FSLogix cloud cache feature for syncing profiles across regions.", "We understand the active-active and active-passive models.", "We use a personal host pool, and we use Azure Site Recovery to replicate session hosts from the primary region to the secondary region.", "None of the above"] },
      { id: "waf_platform_service_limits", type: "checkbox", label: "Platform service limitations — how do you address platform service limitations in AVD?", help: "GCC High first: Gov subscription limits and the Azure support process differ from commercial. AVD second: scale across subscriptions and host pools for high demand.", options: ["We closely monitor our Azure Virtual Desktop deployments, and we keep track of resource usage within our subscription.", "We scale across multiple subscriptions, and we work with Azure support to adjust limits based on our business requirements.", "We scale horizontally for high demand by creating multiple host pools.", "None of the above"] },
      { id: "waf_protect_fslogix", type: "checkbox", label: "Protect FSLogix profiles — how do you protect profiles against data corruption, datacenter failures, and regional outages?", help: "GCC High first: confirm ZRS and Azure Backup availability in the target Gov region. AVD second: no-profile recovery, Azure Backup, ZRS, and Cloud Cache.", options: ["We use a no-profile recovery strategy to minimize the need for protecting profiles.", "We use Azure Backup to back up FSLogix profiles that we store in Azure Files or Azure NetApp Files.", "We use zone-redundant storage to replicate data synchronously across Azure availability zones.", "We use the FSLogix cloud cache feature to replicate profiles across regions.", "None of the above"] },
      { id: "waf_protect_vnet", type: "checkbox", label: "Protect virtual network — how do you protect your virtual network against datacenter and region failures?", help: "GCC High first: pre-build the secondary US Gov region failover network. AVD second: Azure Site Recovery network mapping.", options: ["We set up a virtual network in our secondary region for failover.", "We use Azure Site Recovery to set up a virtual network in our failover region.", "None of the above"] },
      { id: "waf_protect_golden_images", type: "checkbox", label: "Protect golden images — how do you protect images against data corruption, datacenter failures, and regional outages?", help: "GCC High first: replicate the Azure Compute Gallery across US Gov regions. AVD second: ZRS and a secondary compute gallery.", options: ["We use Azure Compute Gallery to store images.", "We use zone-redundant storage to spread copies of images across availability zones.", "We create a secondary compute gallery within a secondary region.", "None of the above"] }
    ],
    toBeState: [
      { id: "target_monitoring", type: "checkbox", label: "Target observability stack", options: ["AVD Insights workbook", "Log Analytics (Gov)", "Azure Monitor alerts", "Microsoft Sentinel (Gov)", "Grafana", "Third-party APM"] },
      { id: "target_slo", type: "text", label: "Target availability SLO", placeholder: "e.g., 99.9% logon success; RTT < 100ms" },
      { id: "target_alerts", type: "checkbox", label: "Key alerts & SLIs to implement", options: ["Connection failure rate", "Round-trip time (RTT)", "Host health / availability", "FSLogix profile errors", "Capacity thresholds", "Security alerts"] },
      { id: "target_az", type: "radio", label: "Availability-zone strategy", options: ["Zone-redundant host pools", "Zonal (pinned)", "No AZ (region only)", "TBD (confirm Gov AZ support)"] },
      { id: "target_bcdr_model", type: "radio", label: "Target BCDR model", options: ["Active/passive (Gov Virginia\u2194Arizona)", "Active/active", "Backup-only", "TBD"] },
      { id: "target_bcdr_replication", type: "checkbox", label: "What is replicated to the secondary region", options: ["FSLogix profiles", "Golden images (Compute Gallery)", "IaC / config", "Personal desktops"] },
      { id: "target_rto", type: "text", label: "Target RTO per cohort", placeholder: "e.g., critical 2h; standard 8h" },
      { id: "target_rpo", type: "text", label: "Target RPO per cohort", placeholder: "e.g., 1h profiles" },
      { id: "target_backup", type: "radio", label: "Profile / personal-desktop backup", options: ["Azure Backup", "ANF snapshots", "Storage replication only", "None", "TBD"] },
      { id: "target_quota_requests", type: "text", label: "Quota increases to request", placeholder: "e.g., +1,000 vCPU US Gov Virginia" },
      { id: "target_headroom", type: "text", label: "Capacity headroom target", placeholder: "e.g., N+1 per host pool" },
      { id: "target_gpu_reservation", type: "select", label: "GPU pool reservation", options: ["Reserved NV-series pool", "On-demand", "None", "TBD"] }
    ]
  },

  /* ======================================================================= *
   * 7. MIGRATION READINESS
   * ======================================================================= */
  {
    id: "migration",
    order: 7,
    title: "Migration Readiness",
    short: "Migration",
    minutes: 30,
    icon: "◭",
    tagline: "App discovery, data-migration to the Gov boundary, pilot cohorts, and cutover strategy.",
    intro: `
## Design area: Migration & Cutover Readiness

Migration into GCC High is not a lift-and-shift. Data and identities crossing the commercial-to-Gov boundary require controlled migration paths, and tenant-to-tenant tooling is subject to cross-cloud limits. Discovery, sequencing, and pilots are planned explicitly.

### Application discovery and assessment
- Inventory line-of-business applications, their authentication (Kerberos/SAML/OIDC), data dependencies, and the Gov availability of any SaaS back ends.
- Categorise each application as rehost on AVD, re-platform, replace, or retire. Identify applications that depend on commercial endpoints.
- Application delivery via **MSIX app attach**, image-baked, or per-user install; validate MSIX app attach support in Gov.

### Data migration
- Profiles, home data, file shares, and mailboxes use Gov-supported migration tooling. Commercial-to-Gov tenant migration generally requires third-party ISV tools with ITAR-cleared handling.
- Maintain chain of custody and ITAR data-handling during migration, with encryption in transit and staged storage inside the boundary.

### Pilot and cutover
- A **pilot cohort** of representative users and applications validates identity, profiles, printing, peripherals, and latency.
- A wave plan sequenced by business unit or classification, with a defined coexistence period and rollback criteria.
- User communications, training, and service-desk runbooks for the target client (Windows App or web client on Gov).
`,
    references: [
      { title: "AVD — MSIX app attach", url: "https://learn.microsoft.com/en-us/azure/virtual-desktop/app-attach-overview", note: "Application delivery decoupled from the image." },
      { title: "AVD deployment prerequisites & planning", url: "https://learn.microsoft.com/en-us/azure/virtual-desktop/prerequisites", note: "Readiness checklist." },
      { title: "GCC High migration guidance", url: "https://learn.microsoft.com/en-us/microsoft-365/enterprise/microsoft-365-guidance-for-security-and-compliance", note: "Boundary & tenant considerations." },
      { title: "Windows App (AVD client)", url: "https://learn.microsoft.com/en-us/azure/virtual-desktop/users/connect-windows-app", note: "End-user client for Gov." },
      { title: "CAF — migrate methodology", url: "https://learn.microsoft.com/en-us/azure/cloud-adoption-framework/migrate/", note: "Assess/migrate/optimize waves." },
      { title: "FSLogix migration", url: "https://learn.microsoft.com/en-us/fslogix/", note: "Profile container migration." }
    ],
    currentState: [
      { id: "app_inventory_maturity", type: "select", label: "Application inventory maturity", options: ["Complete inventory", "Partial", "In progress", "None"] },
      { id: "app_discovery_tool", type: "text", label: "Discovery tooling in use", placeholder: "e.g., Movere, Azure Migrate, manual" },
      { id: "app_auth_types", type: "checkbox", label: "App authentication types present", options: ["Kerberos / NTLM", "SAML", "OIDC / OAuth", "Local / forms", "Certificate", "Unknown"] },
      { id: "app_count", type: "text", label: "Approx. number of LOB apps in scope", placeholder: "e.g., ~45 apps, 12 business-critical" },
      { id: "app_delivery_today", type: "checkbox", label: "Current app delivery methods", options: ["Baked into image", "App-V", "MSIX", "Per-user install", "SaaS/web", "Streamed (Citrix/etc.)"] },
      { id: "data_locations_today", type: "checkbox", label: "Current user data locations", options: ["On-prem file shares", "Home drives", "Exchange / mailboxes", "OneDrive/SharePoint (commercial)", "OneDrive/SharePoint (Gov)", "Azure Files"] },
      { id: "data_cloud_today", type: "select", label: "Primary data cloud today", options: ["Commercial (M365)", "GCC High", "On-prem", "Mixed"] },
      { id: "migration_tooling_today", type: "checkbox", label: "Migration tooling considered / owned", options: ["ISV tenant-migration tool (ITAR-cleared)", "Azure Storage Migration", "Robocopy", "Azure Data Box", "FSLogix migration", "None"] },
      { id: "peripherals_today", type: "checkbox", label: "Peripheral / specialty hardware to support", options: ["CAC / PIV readers", "Scanners", "Plotters / large-format", "Dual / 4K monitors", "USB devices", "Specialized (CAD/GIS)", "None"] },
      /* --- Azure WAF for AVD assessment (GCC High-framed, from WAF AVD workload CSV) --- */
      { id: "waf_app_attach", type: "checkbox", label: "App Attach — do you use App Attach to deliver applications to AVD virtual machines?", help: "GCC High first: confirm App Attach support and replicate the app-attach share to the secondary Gov region for DR. AVD second: separate storage fabric, antivirus exclusions, multi-session concurrency testing, and SMB share permissions.", options: ["We use App Attach, and we separate its storage fabric from FSLogix profile containers.", "We use App Attach, and to avoid performance bottlenecks, we exclude certain files and locations from antivirus scans.", "We use App Attach with a multiple-session host, and we ran a test to see whether two or more users on the same session host can successfully run the app at the same time.", "In our disaster recovery plans for Azure Virtual Desktop, we include steps for replicating our App Attach file share in our secondary failover location, and we ensure that the file share path is accessible in the secondary location.", "We use Azure Files, and we checked that the App Attach file share contains the Storage File Data SMB Share Reader and Storage File Data SMB Share Elevated Contributor permissions.", "None of the above"] }
    ],
    toBeState: [
      { id: "target_app_rationalization", type: "checkbox", label: "App rationalization decisions in scope", options: ["Rehost on AVD", "Re-platform", "Replace (SaaS/Gov)", "Retire", "App attach candidates"] },
      { id: "target_app_notes", type: "text", label: "Key app decisions (comma-separated)", placeholder: "e.g., ERP rehost; CRM replace with Gov SaaS" },
      { id: "target_app_delivery", type: "radio", label: "Primary target app-delivery model", options: ["Image-baked", "MSIX app attach", "Hybrid (image + app attach)", "TBD"] },
      { id: "target_migration_tool", type: "text", label: "Target data-migration tooling", placeholder: "e.g., ITAR-cleared ISV tool + Data Box" },
      { id: "target_migration_staging", type: "select", label: "Staging location", options: ["Inside Gov boundary", "Encrypted transit only", "On-prem staging", "TBD"] },
      { id: "target_chain_of_custody", type: "select", label: "ITAR chain-of-custody", options: ["Documented + cleared personnel", "In progress", "Not required", "TBD"] },
      { id: "target_cutover_method", type: "select", label: "Cutover method", options: ["Big-bang", "Phased waves", "Coexistence", "TBD"] },
      { id: "target_pilot_cohort", type: "text", label: "Pilot cohort (who / how many)", placeholder: "e.g., 25 engineers, 1 BU" },
      { id: "target_pilot_apps", type: "text", label: "Pilot apps (comma-separated)", placeholder: "e.g., Office, ERP client, CAD" },
      { id: "target_pilot_criteria", type: "text", label: "Pilot success criteria", placeholder: "e.g., logon <30s, all apps functional" },
      { id: "target_pilot_duration", type: "text", label: "Pilot duration", placeholder: "e.g., 4 weeks" },
      { id: "target_wave_sequencing", type: "select", label: "Wave sequencing basis", options: ["By business unit", "By data classification", "By region", "By app dependency", "TBD"] },
      { id: "target_coexistence", type: "text", label: "Coexistence window", placeholder: "e.g., 60 days" },
      { id: "target_rollback_criteria", type: "text", label: "Rollback criteria", placeholder: "e.g., >5% logon failure triggers rollback" },
      { id: "target_client", type: "radio", label: "Target end-user client", options: ["Windows App", "Web client", "Both", "Thin clients / kiosks"] },
      { id: "target_adoption", type: "checkbox", label: "Adoption, training & support plan elements", options: ["Comms plan", "End-user training", "Service-desk runbooks", "Hypercare / post-go-live support", "Champions network"] }
    ]
  },

  /* ======================================================================= *
   * 8. PLANNING & EXECUTION
   * ======================================================================= */
  {
    id: "execution",
    order: 8,
    title: "Planning & Execution",
    short: "Execution",
    minutes: 30,
    icon: "◉",
    tagline: "Synthesize decisions into a phased roadmap, RACI, risks, and an ATO-aware delivery plan.",
    intro: `
## Design area: Planning & Execution

This module consolidates the captured decisions into a phased, ATO-aware delivery roadmap. Enterprise-scale delivery is iterative: establish the platform landing zone, then the AVD workload, then scale.

### Delivery sequence
1. **Foundations** — tenant and subscriptions, management group hierarchy, policy guardrails, connectivity (ExpressRoute), identity (AD/Entra), Key Vault.
2. **AVD platform** — image build process, Compute Gallery, storage (FSLogix), monitoring, and security baseline.
3. **Pilot** — a single host pool and pilot cohort validating each design area end to end.
4. **Scale and migrate** — waves by business unit or classification, autoscale tuning, and cost governance.
5. **Operate and optimise** — SLO monitoring, cost reviews, continuous compliance, and ATO continuous monitoring.

### Delivery governance
- A **RACI** across platform, workload, security, and compliance teams.
- A **risk register** covering GCC High-specific risks: service parity gaps, cross-cloud identity, quota and GPU availability, and ISV tool clearance.
- **ATO alignment** mapping delivery milestones to assessment and authorisation gates, with a continuous monitoring plan.
- **Dependencies** including Gov licensing procurement, ExpressRoute provisioning lead time, and personnel clearances.

### Assessment output
Export **assessment.json** as the machine-readable design backlog and use it as input to the SSP, the delivery backlog, and IaC parameterisation.
`,
    references: [
      { title: "CAF — plan methodology", url: "https://learn.microsoft.com/en-us/azure/cloud-adoption-framework/plan/", note: "Backlog & planning." },
      { title: "CAF — Ready: landing zone implementation", url: "https://learn.microsoft.com/en-us/azure/cloud-adoption-framework/ready/", note: "Foundations-first delivery." },
      { title: "AVD landing zone accelerator", url: "https://learn.microsoft.com/en-us/azure/cloud-adoption-framework/scenarios/wvd/enterprise-scale-landing-zone", note: "Reference deployment baseline." },
      { title: "Azure Government — onboarding", url: "https://learn.microsoft.com/en-us/azure/azure-government/documentation-government-get-started-connect-with-portal", note: "Gov onboarding." },
      { title: "WAF — Operational Excellence", url: "https://learn.microsoft.com/en-us/azure/well-architected/operational-excellence/", note: "Delivery & ops practices." },
      { title: "FedRAMP / DoD authorization on Azure", url: "https://learn.microsoft.com/en-us/azure/azure-government/documentation-government-plan-compliance", note: "ATO alignment." }
    ],
    currentState: [
      { id: "team_model", type: "select", label: "Delivery team model", options: ["In-house", "Partner-led", "Hybrid (in-house + partner)", "TBD"] },
      { id: "team_skills", type: "select", label: "AVD / Gov skills readiness", options: ["Strong", "Partial", "Gap", "Unknown"] },
      { id: "team_clearances", type: "select", label: "Cleared personnel available", options: ["Yes — sufficient", "Partial", "No", "N/A"] },
      { id: "timeline_today", type: "text", label: "Target go-live / driving deadline", placeholder: "e.g., pilot in Q3, full cutover by FY-end" },
      { id: "budget_approval", type: "select", label: "Funding / budget status", options: ["Not yet requested", "In approval", "Approved (capex)", "Approved (opex)", "Partially funded"] },
      { id: "dependencies_today", type: "checkbox", label: "Known external dependencies & lead times", options: ["ExpressRoute provisioning", "Gov licensing procurement", "Personnel clearances", "ISV tool clearance", "ATO board schedule", "Hardware procurement"] },
      { id: "risks_today", type: "text", label: "Current top risks / blockers (comma-separated)", placeholder: "e.g., service parity gap, quota, clearance timeline" },
      /* --- Azure WAF for AVD assessment (GCC High-framed, from WAF AVD workload CSV) --- */
      { id: "waf_shared_responsibility", type: "checkbox", label: "Shared responsibility — do you know which components and areas Microsoft manages and which you manage?", help: "GCC High first: understand customer responsibilities under the Azure Government shared-responsibility model. AVD second: covers operations (network topology, session hosts, workspace) and business continuity (VMs, user profile data, environment-specific settings).", options: ["We're aware of our responsibilities under the shared-responsibility model.", "We actively manage the operational components we're responsible for (network topology, session hosts, workspace).", "We actively manage the continuity areas we're responsible for (VMs, user profile data, environment-specific settings).", "None of the above"] },
      { id: "waf_manage_env_focus", type: "checkbox", label: "Environment management — what areas do you focus on when managing your AVD environment?", help: "GCC High first: establish an operations baseline within the Gov boundary. AVD second: availability zones, monitoring tools, dashboards, and alerts.", options: ["We deploy our session hosts in an availability zone.", "We establish an operations baseline.", "We use monitoring tools, dashboards, and alerts.", "None of the above"] }
    ],
    toBeState: [
      { id: "roadmap_foundations", type: "text", label: "Phase 1 — Foundations (timing)", placeholder: "e.g., Q3 2026" },
      { id: "roadmap_platform", type: "text", label: "Phase 2 — AVD platform (timing)", placeholder: "e.g., Q4 2026" },
      { id: "roadmap_pilot", type: "text", label: "Phase 3 — Pilot (timing)", placeholder: "e.g., Q4 2026" },
      { id: "roadmap_scale", type: "text", label: "Phase 4 — Scale & migrate (timing)", placeholder: "e.g., Q1-Q2 2027" },
      { id: "roadmap_operate", type: "text", label: "Phase 5 — Operate & optimize (timing)", placeholder: "e.g., ongoing from Q2 2027" },
      { id: "risk_register", type: "text", label: "Top GCC-High risks (comma-separated)", placeholder: "e.g., service parity gap, cross-cloud identity, GPU availability" },
      { id: "ato_path", type: "select", label: "ATO path", options: ["New ATO", "P-ATO / conditional", "Reciprocity", "Inherited controls", "TBD"] },
      { id: "ato_milestones", type: "text", label: "Milestone-to-gate mapping (comma-separated)", placeholder: "e.g., pilot=SAR, scale=ATO" },
      { id: "ato_conmon", type: "select", label: "Continuous monitoring plan", options: ["Defined (ConMon)", "In progress", "None", "TBD"] },
      { id: "kpi_logon_slo", type: "text", label: "KPI — logon success SLO", placeholder: "e.g., \u2265 99.5%" },
      { id: "kpi_cost_user", type: "text", label: "KPI — cost per user", placeholder: "e.g., \u2264 $X/user/mo" },
      { id: "kpi_users_migrated", type: "text", label: "KPI — users migrated target", placeholder: "e.g., 2,000 by FY-end" },
      { id: "kpi_controls", type: "text", label: "KPI — controls satisfied", placeholder: "e.g., 110/110 800-171" },
      { id: "next_actions", type: "text", label: "Immediate next actions (comma-separated, owner:date)", placeholder: "e.g., request ER circuit (NetTeam, Aug 1); confirm Gov SKUs (Cloud, Jul 20)" },
      { id: "open_decisions", type: "text", label: "Open decisions to resolve (comma-separated)", placeholder: "e.g., join model, SIEM, GPU need" }
    ]
  },

  /* ======================================================================= *
   * 9. CONCLUSION & REPORT
   * ======================================================================= */
  {
    id: "conclusion",
    order: 9,
    title: "Conclusion & Report",
    short: "Conclusion",
    minutes: 10,
    icon: "\u25ce",
    tagline: "Generate the assessment report — current state, Well-Architected references, and target-state decisions.",
    intro: `
## Conclusion

This final step consolidates the assessment into a single **Markdown report** you can share, attach to the SSP, or feed into the design backlog.

The generated report includes, for every module:

- **Current State (as-is)** — all captured inputs, keyed by their question number (e.g., \`1.C3\`).
- **Well-Architected references** — the first-party Microsoft documentation links for that design area.
- **Target State (to-be)** — the recorded design decisions, with **_(assumed)_** flags on any prefilled values that were not explicitly confirmed.

### How to use

1. Use **Download Markdown (.md)** to save the report locally — it is generated in your browser and never leaves the machine.
2. Use **Preview report** to review it inline first, or **Copy to clipboard** to paste it elsewhere.
3. Pair it with the **Export JSON** button (top bar) when you need the machine-readable version.
4. Use **Download acceptance tests (.ps1)** to emit a Pester test skeleton derived from your target-state decisions — each test is keyed by its \`x.Ty\` reference, with assumed and free-text values flagged.

> Tip: set the **engagement name** in the top bar before generating so it appears in the report title and file name.
`,
    references: [
      { title: "Azure Well-Architected Framework", url: "https://learn.microsoft.com/en-us/azure/well-architected/", note: "The five pillars this assessment maps to." },
      { title: "AVD enterprise-scale landing zone", url: "https://learn.microsoft.com/en-us/azure/cloud-adoption-framework/scenarios/wvd/enterprise-scale-landing-zone", note: "Reference architecture & accelerator." },
      { title: "AVD in Azure Government", url: "https://learn.microsoft.com/en-us/azure/virtual-desktop/gov/", note: "GCC High / DoD specifics." }
    ],
    currentState: [],
    toBeState: []
  }
];
