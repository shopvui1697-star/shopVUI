# Architect Agent Memory

## ShopVUI Codebase Patterns
- Prisma: `@@map("snake_case")` for tables, `@map("snake_case")` for fields
- Prisma client imported as `import { prisma } from '@shopvui/db'` (direct import, not DI)
- NestJS services use `@Injectable()`, controllers use Swagger decorators (`@ApiTags`, `@ApiOperation`)
- Shared types exported with `.js` extension: `export { X } from './file.js'`
- `ApiResponse<T>` wrapper in `@shopvui/shared` for all API responses
- `formatCurrency` divides by 100 (prices stored as cents/integers)
- UI components are presentational, exported via tsup
- Web app uses Next.js 15 App Router (src/app/ directory, mostly empty as of inc 0002)
- Auth module pattern: module.ts + service.ts + controller.ts in feature folder
