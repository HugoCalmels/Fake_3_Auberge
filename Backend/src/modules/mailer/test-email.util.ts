// Domaines réservés aux tests (RFC 2606 / RFC 6761) : personne ne peut les
// posséder, donc aucun vrai client n'a une adresse dessus. Les réservations
// faites avec (tests e2e, démos) n'envoient pas d'emails via Brevo.
const RESERVED_TEST_DOMAINS = ['example.com', 'example.net', 'example.org'];
const RESERVED_TEST_TLDS = ['.test', '.example', '.invalid', '.localhost'];

export function isReservedTestEmail(email: string) {
  const domain = email.trim().toLowerCase().split('@').pop() ?? '';

  return (
    RESERVED_TEST_DOMAINS.includes(domain) ||
    RESERVED_TEST_TLDS.some((tld) => domain.endsWith(tld))
  );
}
