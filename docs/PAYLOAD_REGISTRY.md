# Payload Registry

## 1. Standard Envelopes
### Success
```json
{
  "success": true,
  "data": {}
}
```

### Error
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input",
    "details": {}
  }
}
```

## 2. Auth Payloads
### Register (`POST /api/auth/register`)
```json
{
  "email": "user@example.com",
  "name": "User Name",
  "password": "strong-password"
}
```

### Login (`POST /api/auth/login`)
```json
{
  "email": "user@example.com",
  "password": "strong-password"
}
```

## 3. Workflow Payloads
### Create Workflow
```json
{
  "name": "My Workflow",
  "description": "optional",
  "nodes": [
    {
      "id": "uuid",
      "type": "manual-trigger",
      "label": "Manual Run",
      "position": {"x": 10, "y": 20},
      "config": {}
    }
  ],
  "edges": []
}
```

### Trigger Workflow
```json
{
  "payload": {
    "query": "Summarize this"
  }
}
```

## 4. Knowledge Payloads
### Create Corpus
```json
{
  "name": "Policy Corpus",
  "description": "optional",
  "scopeType": "workflow",
  "workflowId": "uuid",
  "metadata": {}
}
```

### Ingest Document
```json
{
  "corpusId": "uuid",
  "title": "policy.txt",
  "contentText": "...",
  "sourceType": "upload",
  "mimeType": "text/plain",
  "metadata": {}
}
```

### Query Knowledge
```json
{
  "query": "What is retention policy?",
  "topK": 8,
  "scopeType": "user"
}
```

## 5. Template Payload
### Instantiate/Preview
```json
{
  "name": "Optional Workflow Name",
  "description": "Optional",
  "params": {
    "queryPath": "query",
    "topK": 8,
    "scopeType": "user"
  }
}
```

## 6. Governance Payloads
### Upsert Model
```json
{
  "provider": "gemini",
  "model": "gemini-2.0-flash",
  "displayName": "Gemini Flash",
  "isActive": true,
  "capabilities": {}
}
```

### Upsert Domain Config
```json
{
  "workflowId": "uuid",
  "domain": "default",
  "config": {
    "retrieval": {"topK": 10, "strategy": "merge"}
  },
  "isActive": true
}
```

### Workspace Create
```json
{
  "name": "Team Workspace"
}
```

### Add Workspace Member
```json
{
  "memberUserId": "uuid",
  "role": "editor"
}
```

### Workflow Permission
```json
{
  "userId": "uuid",
  "role": "viewer",
  "attributes": {"allowedActions": ["view"]},
  "expiresAt": null
}
```

### IAM Policy
```json
{
  "action": "execute",
  "effect": "allow",
  "conditions": {
    "all": [
      {"path": "requester.role", "op": "neq", "value": "viewer"}
    ]
  },
  "isActive": true
}
```

### Hyperparameter Profile
```json
{
  "name": "Creative",
  "workflowId": "uuid",
  "config": {"llm": {"temperature": 0.8}},
  "isDefault": false,
  "isActive": true
}
```

### Alert Rule
```json
{
  "ruleType": "latency-breach",
  "severity": "critical",
  "threshold": 5000,
  "windowMinutes": 60,
  "config": {},
  "isActive": true
}
```

## 7. Compliance Payloads
### Consent
```json
{
  "consentType": "privacy",
  "policyVersion": "v1",
  "granted": true,
  "metadata": {}
}
```

### Retention Policy
```json
{
  "resourceType": "executions",
  "retentionDays": 30,
  "config": {},
  "isActive": true
}
```

### Legal Basis
```json
{
  "gdprBasis": "consent",
  "dpdpBasis": "consent",
  "purposeDescription": "Answer customer support questions",
  "dataCategories": ["contact_data"],
  "crossBorderTransfer": false,
  "transferSafeguards": null,
  "retentionDays": 30
}
```

### Data Subject Request Create
```json
{
  "requestType": "access",
  "description": "Provide all data stored about me",
  "dueDate": "2026-04-30T00:00:00.000Z"
}
```

### Data Subject Request Respond
```json
{
  "status": "completed",
  "response": "Export generated and delivered"
}
```

## 8. Publication and REX Payloads
### Create Publication
```json
{
  "workflowId": "uuid",
  "title": "Support Assistant",
  "description": "Tenant-safe support flow",
  "inputSchema": {},
  "outputDisplay": {},
  "category": "support",
  "tags": ["support", "rag"]
}
```

### Execute Publication
```json
{
  "inputs": {
    "question": "How do I reset password?"
  }
}
```

### Apply REX Fixes
```json
{
  "nodeId": "node-123",
  "actions": ["ENABLE_AUDIT_LOGGING", "INSERT_GUARDRAIL_UPSTREAM"]
}
```

## 9. Utility Payloads
### Chat
```json
{
  "message": "Why did this fail?",
  "workflow": {
    "name": "Flow",
    "description": "",
    "nodes": [],
    "edges": []
  },
  "executionStatus": "failed",
  "nodeStatuses": {},
  "history": []
}
```

### File Parse
```json
{
  "fileContent": "base64...",
  "fileName": "data.csv",
  "fileFormat": "csv"
}
```
