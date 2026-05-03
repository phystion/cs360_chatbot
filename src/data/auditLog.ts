import { AuditRecord } from '../types';

export const auditLog: AuditRecord[] = [];

let counter = 0;

export function createAuditRecord(
  role: AuditRecord['role'],
  question: string,
  toolUsed: string,
  dataUsed: string,
  assumptions: string,
  riskLevel: AuditRecord['riskLevel']
): AuditRecord {
  counter++;
  const record: AuditRecord = {
    id: `REC-${String(counter).padStart(3, '0')}`,
    role,
    question,
    toolUsed,
    dataUsed,
    assumptions,
    riskLevel,
    reviewStatus: `Pending ${role.toLowerCase()} review`,
    timestamp: new Date().toISOString(),
  };
  auditLog.push(record);
  return record;
}
