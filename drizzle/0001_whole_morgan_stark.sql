CREATE TABLE `cost_calculations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`functionName` varchar(128) NOT NULL,
	`inputTokens` int DEFAULT 0,
	`outputTokens` int DEFAULT 0,
	`calls` int DEFAULT 1,
	`estimatedCostUsd` float NOT NULL,
	`userId` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `cost_calculations_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `edge_function_templates` (
	`id` int AUTO_INCREMENT NOT NULL,
	`slug` varchar(128) NOT NULL,
	`name` varchar(256) NOT NULL,
	`description` text NOT NULL,
	`category` varchar(64) NOT NULL,
	`code` text NOT NULL,
	`envVarsRequired` json,
	`deployedProjectId` varchar(64),
	`deployedAt` timestamp,
	`isDeployed` boolean NOT NULL DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `edge_function_templates_id` PRIMARY KEY(`id`),
	CONSTRAINT `edge_function_templates_slug_unique` UNIQUE(`slug`)
);
--> statement-breakpoint
CREATE TABLE `function_registry` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(128) NOT NULL,
	`displayName` varchar(256) NOT NULL,
	`category` enum('llm','image','video','audio','search','code','database','communication','vector','utility') NOT NULL,
	`provider` varchar(128) NOT NULL,
	`description` text NOT NULL,
	`endpoint` varchar(512),
	`costPer1k` float,
	`costUnit` varchar(64),
	`inputSchema` json,
	`outputSchema` json,
	`edgeFunctionTemplate` text,
	`tags` json,
	`isActive` boolean NOT NULL DEFAULT true,
	`usageCount` int NOT NULL DEFAULT 0,
	`avgLatencyMs` int DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `function_registry_id` PRIMARY KEY(`id`),
	CONSTRAINT `function_registry_name_unique` UNIQUE(`name`)
);
--> statement-breakpoint
CREATE TABLE `integration_logs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`integration` enum('ai-control-center','sentinel','supabase-mgmt','vercel') NOT NULL,
	`action` varchar(128) NOT NULL,
	`payload` json,
	`response` json,
	`status` enum('success','error','pending') NOT NULL DEFAULT 'pending',
	`errorMessage` text,
	`durationMs` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `integration_logs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `kimi_executions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`sessionId` varchar(64) NOT NULL,
	`userPrompt` text NOT NULL,
	`kimiPlan` json,
	`functionsUsed` json,
	`result` text,
	`status` enum('pending','running','completed','failed') NOT NULL DEFAULT 'pending',
	`totalCostUsd` float DEFAULT 0,
	`durationMs` int,
	`parallelSteps` int DEFAULT 0,
	`userId` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`completedAt` timestamp,
	CONSTRAINT `kimi_executions_id` PRIMARY KEY(`id`)
);
