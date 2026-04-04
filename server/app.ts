import cors from 'cors';
import express from 'express';
import type { DecodedIdToken } from 'firebase-admin/auth';
import { pool } from './db';
import { adminAuth } from './firebaseAdmin';
import { canPerform, type AppRole, platformTenantRoles, tenantProfileRoles, userManagementRoles } from './permissions';
import { resources } from './resources';

type AuthenticatedRequest = express.Request & {
  auth?: {
    uid: string;
    userId: string;
    email: string;
    name?: string;
    role: AppRole;
    tenantId: string;
    tenantName: string;
    tenantSlug: string;
  };
};

type AppUserRow = {
  id: string;
  firebase_uid: string;
  email: string;
  name: string | null;
  status: string;
  created_at: string;
};

type TenantProfileRow = {
  id: string;
  name: string;
  trade_name: string | null;
  slug: string;
  cnpj: string | null;
  state_registration: string | null;
  municipal_registration: string | null;
  tax_regime: string | null;
  main_cnae: string | null;
  secondary_cnaes: string | null;
  opened_at: string | null;
  legal_representative: string | null;
  phone: string | null;
  whatsapp: string | null;
  email: string | null;
  financial_email: string | null;
  fiscal_email: string | null;
  website: string | null;
  zip_code: string | null;
  ibge_code: string | null;
  address_line: string | null;
  address_number: string | null;
  address_complement: string | null;
  district: string | null;
  city: string | null;
  state: string | null;
  plan: string;
  status: 'active' | 'inactive' | 'suspended';
};

type PlatformTenantRow = {
  id: string;
  name: string;
  trade_name: string | null;
  slug: string;
  cnpj: string | null;
  city: string | null;
  state: string | null;
  plan: string;
  status: 'active' | 'inactive' | 'suspended';
  created_at: string;
  owner_name: string | null;
  owner_email: string | null;
  owner_linked: boolean;
};

const app = express();

app.use(cors());
app.use(express.json());

function getSpecialRole(email?: string): AppRole | null {
  if (email === 'pedroteixeirati@hotmail.com') return 'dev';
  if (email === 'pedroteixeirati@gmail.com') return 'owner';
  return null;
}

function canManageTenantUsers(role?: AppRole) {
  return !!role && userManagementRoles.includes(role);
}

function canManageTenantProfile(role?: AppRole) {
  return !!role && tenantProfileRoles.includes(role);
}

function canManagePlatformTenants(role?: AppRole) {
  return !!role && platformTenantRoles.includes(role);
}

function ensureAllowed(res: express.Response, allowed: boolean, message: string) {
  if (!allowed) {
    res.status(403).json({ error: message });
    return false;
  }
  return true;
}

function slugify(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40);
}

function defaultTenantName(token: DecodedIdToken) {
  const base = token.name?.trim() || token.email?.split('@')[0] || 'Transportadora';
  return `${base} Transportes`;
}

function tenantSlugFor(token: DecodedIdToken) {
  const base = slugify(token.email?.split('@')[0] || token.name || 'transportadora') || 'transportadora';
  return `${base}-${token.uid.slice(0, 6)}`;
}

function mapRow<T extends Record<string, unknown>>(row: Record<string, unknown>, fields: { api: string; db: string }[]) {
  const mapped: Record<string, unknown> = { id: row.id };
  for (const field of fields) {
    mapped[field.api] = row[field.db];
  }
  return mapped as T;
}

function mapTenantProfile(row: TenantProfileRow) {
  return {
    id: row.id,
    name: row.name,
    tradeName: row.trade_name || '',
    slug: row.slug,
    cnpj: row.cnpj || '',
    stateRegistration: row.state_registration || '',
    municipalRegistration: row.municipal_registration || '',
    taxRegime: row.tax_regime || '',
    mainCnae: row.main_cnae || '',
    secondaryCnaes: row.secondary_cnaes || '',
    openedAt: row.opened_at || '',
    legalRepresentative: row.legal_representative || '',
    phone: row.phone || '',
    whatsapp: row.whatsapp || '',
    email: row.email || '',
    financialEmail: row.financial_email || '',
    fiscalEmail: row.fiscal_email || '',
    website: row.website || '',
    zipCode: row.zip_code || '',
    ibgeCode: row.ibge_code || '',
    addressLine: row.address_line || '',
    addressNumber: row.address_number || '',
    addressComplement: row.address_complement || '',
    district: row.district || '',
    city: row.city || '',
    state: row.state || '',
    plan: row.plan,
    status: row.status,
  };
}

function mapPlatformTenant(row: PlatformTenantRow) {
  return {
    id: row.id,
    name: row.name,
    tradeName: row.trade_name || '',
    slug: row.slug,
    cnpj: row.cnpj || '',
    city: row.city || '',
    state: row.state || '',
    plan: row.plan,
    status: row.status,
    ownerName: row.owner_name || '',
    ownerEmail: row.owner_email || '',
    ownerLinked: row.owner_linked,
    createdAt: row.created_at,
  };
}

async function ensureUser(decoded: DecodedIdToken) {
  const existing = await pool.query<AppUserRow>(
    `select id, firebase_uid, email, name, status, created_at
     from users
     where firebase_uid = $1
     limit 1`,
    [decoded.uid]
  );

  if (existing.rows[0]) {
    return existing.rows[0];
  }

  const created = await pool.query<AppUserRow>(
    `insert into users (firebase_uid, email, role, name, status)
     values ($1, $2, $3, $4, 'active')
     returning id, firebase_uid, email, name, status, created_at`,
    [decoded.uid, decoded.email || '', getSpecialRole(decoded.email) || 'viewer', decoded.name || null]
  );

  return created.rows[0];
}

async function ensureTenantContext(user: AppUserRow, decoded: DecodedIdToken) {
  const existingMembership = await pool.query<{
    tenant_id: string;
    tenant_name: string;
    tenant_slug: string;
    role: AppRole;
  }>(
    `select tu.tenant_id,
            t.name as tenant_name,
            t.slug as tenant_slug,
            tu.role
     from tenant_users tu
     inner join tenants t on t.id = tu.tenant_id
     where tu.user_id = $1
     order by tu.created_at asc
     limit 1`,
    [user.id]
  );

  if (existingMembership.rows[0]) {
    return existingMembership.rows[0];
  }

  const tenant = await pool.query<{ id: string; name: string; slug: string }>(
    `insert into tenants (name, slug, status, plan)
     values ($1, $2, 'active', 'starter')
     returning id, name, slug`,
    [defaultTenantName(decoded), tenantSlugFor(decoded)]
  );

  const bootstrapRole = getSpecialRole(decoded.email) || 'owner';

  await pool.query(
    `insert into tenant_users (tenant_id, user_id, role, status)
     values ($1, $2, $3, 'active')`,
    [tenant.rows[0].id, user.id, bootstrapRole]
  );

  return {
    tenant_id: tenant.rows[0].id,
    tenant_name: tenant.rows[0].name,
    tenant_slug: tenant.rows[0].slug,
    role: bootstrapRole,
  };
}

async function loadAuthContext(req: AuthenticatedRequest, res: express.Response, next: express.NextFunction) {
  try {
    const header = req.headers.authorization;
    if (!header?.startsWith('Bearer ')) {
      res.status(401).json({ error: 'Token de autenticacao ausente.' });
      return;
    }

    const decoded = await adminAuth.verifyIdToken(header.replace('Bearer ', ''));
    const user = await ensureUser(decoded);
    const membership = await ensureTenantContext(user, decoded);

    req.auth = {
      uid: decoded.uid,
      userId: user.id,
      email: user.email,
      name: user.name || decoded.name,
      role: membership.role,
      tenantId: membership.tenant_id,
      tenantName: membership.tenant_name,
      tenantSlug: membership.tenant_slug,
    };

    next();
  } catch (error) {
    next(error);
  }
}

app.get('/api/health', (_req, res) => {
  res.json({ ok: true });
});

app.get('/api/me/profile', loadAuthContext, async (req: AuthenticatedRequest, res) => {
  const auth = req.auth!;

  res.json({
    uid: auth.uid,
    email: auth.email,
    role: auth.role,
    name: auth.name,
    tenantId: auth.tenantId,
    tenantName: auth.tenantName,
    tenantSlug: auth.tenantSlug,
  });
});

app.get('/api/tenant-profile', loadAuthContext, async (req: AuthenticatedRequest, res, next) => {
  try {
    if (!ensureAllowed(res, canManageTenantProfile(req.auth?.role), 'Sem permissao para visualizar o perfil da transportadora.')) {
      return;
    }

    const result = await pool.query<TenantProfileRow>(
      `select id,
              name,
              trade_name,
              slug,
              cnpj,
              state_registration,
              municipal_registration,
              tax_regime,
              main_cnae,
              secondary_cnaes,
              opened_at,
              legal_representative,
              phone,
              whatsapp,
              email,
              financial_email,
              fiscal_email,
              website,
              zip_code,
              ibge_code,
              address_line,
              address_number,
              address_complement,
              district,
              city,
              state,
              plan,
              status
       from tenants
       where id = $1
       limit 1`,
      [req.auth?.tenantId]
    );

    if (!result.rows[0]) {
      res.status(404).json({ error: 'Transportadora nao encontrada.' });
      return;
    }

    res.json(mapTenantProfile(result.rows[0]));
  } catch (error) {
    next(error);
  }
});

app.put('/api/tenant-profile', loadAuthContext, async (req: AuthenticatedRequest, res, next) => {
  try {
    if (!ensureAllowed(res, canManageTenantProfile(req.auth?.role), 'Sem permissao para editar o perfil da transportadora.')) {
      return;
    }

    const {
      name,
      tradeName,
      slug,
      cnpj,
      stateRegistration,
      municipalRegistration,
      taxRegime,
      mainCnae,
      secondaryCnaes,
      openedAt,
      legalRepresentative,
      phone,
      whatsapp,
      email,
      financialEmail,
      fiscalEmail,
      website,
      zipCode,
      ibgeCode,
      addressLine,
      addressNumber,
      addressComplement,
      district,
      city,
      state,
      plan,
      status,
    } = req.body as Record<string, string>;

    const normalizedSlug = slugify(slug || name || req.auth?.tenantSlug || 'transportadora') || req.auth?.tenantSlug || 'transportadora';

    const result = await pool.query<TenantProfileRow>(
      `update tenants
       set name = $1,
           trade_name = $2,
           slug = $3,
           cnpj = $4,
           state_registration = $5,
           municipal_registration = $6,
           tax_regime = $7,
           main_cnae = $8,
           secondary_cnaes = $9,
           opened_at = $10,
           legal_representative = $11,
           phone = $12,
           whatsapp = $13,
           email = $14,
           financial_email = $15,
           fiscal_email = $16,
           website = $17,
           zip_code = $18,
           ibge_code = $19,
           address_line = $20,
           address_number = $21,
           address_complement = $22,
           district = $23,
           city = $24,
           state = $25,
           plan = $26,
           status = $27,
           updated_at = now()
       where id = $28
       returning id,
                 name,
                 trade_name,
                 slug,
                 cnpj,
                 state_registration,
                 municipal_registration,
                 tax_regime,
                 main_cnae,
                 secondary_cnaes,
                 opened_at,
                 legal_representative,
                 phone,
                 whatsapp,
                 email,
                 financial_email,
                 fiscal_email,
                 website,
                 zip_code,
                 ibge_code,
                 address_line,
                 address_number,
                 address_complement,
                 district,
                 city,
                 state,
                 plan,
                 status`,
      [
        name || req.auth?.tenantName || 'Transportadora',
        tradeName || null,
        normalizedSlug,
        cnpj || null,
        stateRegistration || null,
        municipalRegistration || null,
        taxRegime || null,
        mainCnae || null,
        secondaryCnaes || null,
        openedAt || null,
        legalRepresentative || null,
        phone || null,
        whatsapp || null,
        email || null,
        financialEmail || null,
        fiscalEmail || null,
        website || null,
        zipCode || null,
        ibgeCode || null,
        addressLine || null,
        addressNumber || null,
        addressComplement || null,
        district || null,
        city || null,
        state || null,
        plan || 'starter',
        status || 'active',
        req.auth?.tenantId,
      ]
    );

    if (!result.rows[0]) {
      res.status(404).json({ error: 'Transportadora nao encontrada.' });
      return;
    }

    res.json(mapTenantProfile(result.rows[0]));
  } catch (error) {
    next(error);
  }
});

app.get('/api/platform/tenants', loadAuthContext, async (req: AuthenticatedRequest, res, next) => {
  try {
    if (!ensureAllowed(res, canManagePlatformTenants(req.auth?.role), 'Sem permissao para visualizar transportadoras da plataforma.')) {
      return;
    }

    const result = await pool.query<PlatformTenantRow>(
      `select t.id,
              t.name,
              t.trade_name,
              t.slug,
              t.cnpj,
              t.city,
              t.state,
              t.plan,
              t.status,
              t.created_at,
              coalesce(u.name, '') as owner_name,
              coalesce(u.email, '') as owner_email,
              (u.id is not null) as owner_linked
       from tenants t
       left join lateral (
         select tu.user_id
         from tenant_users tu
         where tu.tenant_id = t.id
           and tu.role = 'owner'
         order by tu.created_at asc
         limit 1
       ) tenant_owner on true
       left join users u on u.id = tenant_owner.user_id
       order by t.created_at desc`
    );

    res.json(result.rows.map(mapPlatformTenant));
  } catch (error) {
    next(error);
  }
});

app.post('/api/platform/tenants', loadAuthContext, async (req: AuthenticatedRequest, res, next) => {
  const client = await pool.connect();

  try {
    if (!ensureAllowed(res, canManagePlatformTenants(req.auth?.role), 'Sem permissao para criar transportadoras.')) {
      return;
    }

    const {
      name,
      tradeName,
      slug,
      cnpj,
      city,
      state,
      plan,
      status,
      ownerUid,
      ownerEmail,
      ownerName,
    } = req.body as {
      name: string;
      tradeName?: string;
      slug?: string;
      cnpj?: string;
      city?: string;
      state?: string;
      plan?: string;
      status?: 'active' | 'inactive' | 'suspended';
      ownerUid: string;
      ownerEmail: string;
      ownerName?: string;
    };

    if (!name?.trim() || !ownerUid?.trim() || !ownerEmail?.trim()) {
      res.status(400).json({ error: 'Nome da transportadora e dados do usuario owner sao obrigatorios.' });
      return;
    }

    const normalizedSlug = slugify(slug || tradeName || name) || `tenant-${Date.now()}`;

    await client.query('begin');

    const tenantResult = await client.query<{ id: string }>(
      `insert into tenants (name, trade_name, slug, cnpj, city, state, plan, status)
       values ($1, $2, $3, $4, $5, $6, $7, $8)
       returning id`,
      [
        name.trim(),
        tradeName?.trim() || null,
        normalizedSlug,
        cnpj?.trim() || null,
        city?.trim() || null,
        state?.trim() || null,
        plan?.trim() || 'starter',
        status || 'active',
      ]
    );

    const userResult = await client.query<AppUserRow>(
      `insert into users (firebase_uid, email, role, name, status)
       values ($1, $2, 'owner', $3, 'active')
       on conflict (firebase_uid) do update set
         email = excluded.email,
         role = 'owner',
         name = excluded.name,
         status = 'active',
         updated_at = now()
       returning id, firebase_uid, email, name, status, created_at`,
      [ownerUid.trim(), ownerEmail.trim(), ownerName?.trim() || null]
    );

    await client.query(
      `insert into tenant_users (tenant_id, user_id, role, status)
       values ($1, $2, 'owner', 'active')
       on conflict (tenant_id, user_id) do update set
         role = 'owner',
         status = 'active',
         updated_at = now()`,
      [tenantResult.rows[0].id, userResult.rows[0].id]
    );

    const created = await client.query<PlatformTenantRow>(
      `select t.id,
              t.name,
              t.trade_name,
              t.slug,
              t.cnpj,
              t.city,
              t.state,
              t.plan,
              t.status,
              t.created_at,
              coalesce(u.name, '') as owner_name,
              coalesce(u.email, '') as owner_email,
              true as owner_linked
       from tenants t
       left join users u on u.id = $2
       where t.id = $1
       limit 1`,
      [tenantResult.rows[0].id, userResult.rows[0].id]
    );

    await client.query('commit');

    res.status(201).json(mapPlatformTenant(created.rows[0]));
  } catch (error) {
    await client.query('rollback');
    next(error);
  } finally {
    client.release();
  }
});

app.post('/api/users', loadAuthContext, async (req: AuthenticatedRequest, res, next) => {
  try {
    if (!ensureAllowed(res, canManageTenantUsers(req.auth?.role), 'Sem permissao para gerenciar usuarios neste tenant.')) {
      return;
    }

    const { uid, email, role, name } = req.body as {
      uid: string;
      email: string;
      role: AppRole;
      name?: string;
    };

    if (req.auth?.role !== 'dev' && role === 'admin') {
      res.status(403).json({ error: 'Apenas o perfil dev pode promover usuarios para admin.' });
      return;
    }

    const allowedRoles: AppRole[] = req.auth?.role === 'dev'
      ? ['admin', 'financial', 'operational', 'driver', 'viewer']
      : ['financial', 'operational', 'driver', 'viewer'];

    if (!allowedRoles.includes(role)) {
      res.status(400).json({ error: 'Perfil de acesso invalido para cadastro.' });
      return;
    }

    const userResult = await pool.query<AppUserRow>(
      `insert into users (firebase_uid, email, name, status)
       values ($1, $2, $3, 'active')
       on conflict (firebase_uid) do update set
         email = excluded.email,
         name = excluded.name,
         updated_at = now()
       returning id, firebase_uid, email, name, status, created_at`,
      [uid, email, name || null]
    );

    const user = userResult.rows[0];

    await pool.query(
      `insert into tenant_users (tenant_id, user_id, role, status)
       values ($1, $2, $3, 'active')
       on conflict (tenant_id, user_id) do update set
         role = excluded.role,
         status = excluded.status,
         updated_at = now()`,
      [req.auth?.tenantId, user.id, role]
    );

    res.status(201).json({
      uid: user.firebase_uid,
      email: user.email,
      role,
      name: user.name,
      tenantId: req.auth?.tenantId,
      tenantName: req.auth?.tenantName,
      tenantSlug: req.auth?.tenantSlug,
    });
  } catch (error) {
    next(error);
  }
});

for (const [resourceName, resource] of Object.entries(resources)) {
  app.get(`/api/${resourceName}`, loadAuthContext, async (req: AuthenticatedRequest, res, next) => {
    try {
      if (!ensureAllowed(res, canPerform('read', resource.permissions, req.auth?.role), 'Sem permissao para visualizar este recurso.')) {
        return;
      }

      const result = await pool.query(
        `select id, tenant_id, ${resource.fields.map((field) => field.db).join(', ')}
         from ${resource.table}
         where tenant_id = $1
         order by ${resource.orderBy}`,
        [req.auth?.tenantId]
      );

      res.json(result.rows.map((row) => mapRow(row, resource.fields)));
    } catch (error) {
      next(error);
    }
  });

  app.post(`/api/${resourceName}`, loadAuthContext, async (req: AuthenticatedRequest, res, next) => {
    try {
      if (!ensureAllowed(res, canPerform('create', resource.permissions, req.auth?.role), 'Sem permissao para criar neste recurso.')) {
        return;
      }

      const columns = ['tenant_id', ...resource.fields.map((field) => field.db)];
      const placeholders = columns.map((_, index) => `$${index + 1}`).join(', ');
      const values = [req.auth?.tenantId, ...resource.fields.map((field) => req.body[field.api])];
      const result = await pool.query(
        `insert into ${resource.table} (${columns.join(', ')})
         values (${placeholders})
         returning id, tenant_id, ${resource.fields.map((field) => field.db).join(', ')}`,
        values
      );

      res.status(201).json(mapRow(result.rows[0], resource.fields));
    } catch (error) {
      next(error);
    }
  });

  app.put(`/api/${resourceName}/:id`, loadAuthContext, async (req: AuthenticatedRequest, res, next) => {
    try {
      if (!ensureAllowed(res, canPerform('update', resource.permissions, req.auth?.role), 'Sem permissao para editar este recurso.')) {
        return;
      }

      const assignments = resource.fields.map((field, index) => `${field.db} = $${index + 1}`);
      const params = [
        ...resource.fields.map((field) => req.body[field.api]),
        req.params.id,
        req.auth?.tenantId,
      ];

      const result = await pool.query(
        `update ${resource.table}
         set ${assignments.join(', ')}, updated_at = now()
         where id = $${resource.fields.length + 1}
           and tenant_id = $${resource.fields.length + 2}
         returning id, tenant_id, ${resource.fields.map((field) => field.db).join(', ')}`,
        params
      );

      if (!result.rows[0]) {
        res.status(404).json({ error: 'Registro nao encontrado.' });
        return;
      }

      res.json(mapRow(result.rows[0], resource.fields));
    } catch (error) {
      next(error);
    }
  });

  app.delete(`/api/${resourceName}/:id`, loadAuthContext, async (req: AuthenticatedRequest, res, next) => {
    try {
      if (!ensureAllowed(res, canPerform('delete', resource.permissions, req.auth?.role), 'Sem permissao para excluir este recurso.')) {
        return;
      }

      const result = await pool.query(
        `delete from ${resource.table}
         where id = $1 and tenant_id = $2
         returning id`,
        [req.params.id, req.auth?.tenantId]
      );

      if (!result.rows[0]) {
        res.status(404).json({ error: 'Registro nao encontrado.' });
        return;
      }

      res.status(204).send();
    } catch (error) {
      next(error);
    }
  });
}

app.use((error: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(error);
  res.status(500).json({ error: error.message || 'Erro interno do servidor.' });
});

export default app;
