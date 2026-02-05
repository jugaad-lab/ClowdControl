# PM Dispatch Quick Reference

When you (Chhotu/PM) receive a start notification in #disclawd-mission-control, follow these steps **in order**:

## 1. Get Task Details
```bash
curl -s "https://emsivxzsrkovjrrpquki.supabase.co/rest/v1/tasks?id=eq.{TASK_ID}&select=*" \
  -H "apikey: {ANON_KEY}" -H "Authorization: Bearer {ANON_KEY}" | python3 -m json.tool
```

## 2. Get Available Agents  
```bash
curl -s "https://emsivxzsrkovjrrpquki.supabase.co/rest/v1/agents?agent_type=eq.specialist&is_active=eq.true&select=id,display_name,role,capabilities,invocation_method,invocation_config" \
  -H "apikey: {ANON_KEY}" -H "Authorization: Bearer {ANON_KEY}" | python3 -m json.tool
```

## 3. Match Task → Agent
See PM-PROTOCOL.md Step 3 for mapping table.

## 4. Write Task File
Create `tasks/TASK-{slug}.md` following the template.

## 5. Spawn Agent
- **sessions_spawn agents:** Use `sessions_spawn` with model from `invocation_config`
- **claude_code agents (friday-dev):** Use coding-agent skill, write TASK.md first

## 6. Update Status
Update task in Supabase to `assigned` with the agent ID.
