const fs = require('fs');

let route = fs.readFileSync('src/app/api/admin/expenses/[id]/route.ts', 'utf8');

// Replace signature
route = route.replace(
  "export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {",
  "export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {"
);

// Resolve params
route = route.replace(
  "  const user = await requireCrmUser();",
  "  const { id } = await params;\n  const user = await requireCrmUser();"
);

// Use the resolved id
route = route.replace(
  "    .eq('id', params.id);",
  "    .eq('id', id);"
);

fs.writeFileSync('src/app/api/admin/expenses/[id]/route.ts', route);
