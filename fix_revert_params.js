const fs = require('fs');

let route = fs.readFileSync('src/app/api/admin/expenses/[id]/route.ts', 'utf8');

// Replace signature back to normal
route = route.replace(
  "export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {",
  "export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {"
);

// Remove the resolved id line
route = route.replace(
  "  const { id } = await params;\n  const user = await requireCrmUser();",
  "  const user = await requireCrmUser();"
);

// Use params.id
route = route.replace(
  "    .eq('id', id);",
  "    .eq('id', params.id);"
);

fs.writeFileSync('src/app/api/admin/expenses/[id]/route.ts', route);
