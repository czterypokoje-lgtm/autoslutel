const fs = require('fs');

let route = fs.readFileSync('src/app/api/admin/expenses/[id]/route.ts', 'utf8');

// The current signature is: export async function PATCH(req: NextRequest, { params }: any) {
// Replace the start of the function body
route = route.replace(
  "  const user = await requireCrmUser();",
  "  const resolvedParams = await Promise.resolve(params);\n  const id = resolvedParams.id;\n  const user = await requireCrmUser();"
);

route = route.replace(
  "    .eq('id', params.id);",
  "    .eq('id', id);"
);

fs.writeFileSync('src/app/api/admin/expenses/[id]/route.ts', route);
