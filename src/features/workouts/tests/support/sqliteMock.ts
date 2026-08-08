export type SqliteMockRule = {
  match: RegExp;
  rows?: unknown[][];
  changes?: number;
  lastInsertRowId?: number;
};

export type SqliteMockCall = {
  sql: string;
  kind: 'run' | 'all';
  params: unknown[];
};

type MockStatement = {
  executeSync: jest.Mock;
  executeForRawResultSync: jest.Mock;
};

export const expoSqliteMock = {
  rules: [] as SqliteMockRule[],
  calls: [] as SqliteMockCall[],

  reset() {
    this.rules.length = 0;
    this.calls.length = 0;
  },

  rule(rule: SqliteMockRule) {
    this.rules.push(rule);
    return rule;
  },

  callsMatching(sqlPattern: RegExp, kind?: 'run' | 'all') {
    return this.calls.filter((call) => {
      const matchesSql = sqlPattern.test(call.sql);
      return kind === undefined ? matchesSql : matchesSql && call.kind === kind;
    });
  },

  ruleMatcher(sql: string) {
    return this.rules.find((rule) => rule.match.test(sql));
  },

  openDatabaseSync() {
    return {
      execSync: jest.fn(),
      prepareSync: jest.fn((sql: string): MockStatement => {
        const match = expoSqliteMock.ruleMatcher(sql);
        return {
          executeSync: jest.fn((params: unknown[]) => {
            expoSqliteMock.calls.push({ sql, kind: 'run', params: params ?? [] });
            return match
              ? { changes: match.changes ?? 0, lastInsertRowId: match.lastInsertRowId ?? 0 }
              : { changes: 0, lastInsertRowId: 0 };
          }),
          executeForRawResultSync: jest.fn((params: unknown[]) => {
            expoSqliteMock.calls.push({ sql, kind: 'all', params: params ?? [] });
            return {
              getAllSync: jest.fn(() => match?.rows ?? []),
              getFirstSync: jest.fn(() => match?.rows?.[0] ?? null),
            };
          }),
        };
      }),
    };
  },
};