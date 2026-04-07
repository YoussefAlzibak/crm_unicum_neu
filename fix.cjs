const fs = require('fs');
const path = require('path');

const dir = 'supabase/migrations';
const files = fs.readdirSync(dir).filter(f => f.endsWith('.sql'));

for (const file of files) {
  let content = fs.readFileSync(path.join(dir, file), 'utf-8');
  
  // Remove existing drop policy/trigger lines to prevent duplication if script is run multiple times
  content = content.replace(/drop policy if exists "[^"]+"\s+on\s+[a-zA-Z0-9_]+;\n?/gi, '');
  content = content.replace(/drop trigger if exists [a-zA-Z0-9_]+\s+on\s+[a-zA-Z0-9_]+;\n?/gi, '');
  
  // Add drop policy before create policy
  content = content.replace(/create policy\s+"([^"]+)"\s+on\s+([a-zA-Z0-9_]+)/gi, (match, policyName, tableName) => {
    return `drop policy if exists "${policyName}" on ${tableName};\n${match}`;
  });

  // Add drop trigger before create trigger
  content = content.replace(/create trigger\s+([a-zA-Z0-9_]+)\s+(before|after)\s+(insert|update|delete|insert or update or delete)\s+on\s+([a-zA-Z0-9_]+)/gi, (match, triggerName, timing, action, tableName) => {
    return `drop trigger if exists ${triggerName} on ${tableName};\n${match}`;
  });

  fs.writeFileSync(path.join(dir, file), content);
}
console.log('Migration files updated for safety!');
