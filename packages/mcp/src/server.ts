// src/server.ts

import { Server } from '@modelcontextprotocol/sdk/server';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/stdio';

import {
  generate,
  validatePipeline,
  validateAction,
  type StablyBaseAction,
  type StablyContract,
  type PipelineInstance
} from '@stably/core';

/**
 * Configuration for the Stably MCP server.
 *
 * This stays intentionally small:
 * - name/version: advertised MCP server identity
 * - logger: optional structured logging hooks
 */
export interface StablyMcpServerConfig {
  /**
   * Server name reported to the MCP client.
   * Defaults to "stably-mcp".
   */
  name?: string;

  /**
   * Semantic version for the server, reported to the client.
   * Defaults to "0.1.0".
   */
  version?: string;

  /**
   * Optional logger. All methods are optional and default to console.
   */
  logger?: {
    debug?: (...args: unknown[]) => void;
    info?: (...args: unknown[]) => void;
    warn?: (...args: unknown[]) => void;
    error?: (...args: unknown[]) => void;
  };
}

/**
 * Internal helper: resolve logger with sensible console fallbacks.
 */
function createLogger(config?: StablyMcpServerConfig['logger']) {
  const noop = () => {};
  return {
    debug: config?.debug ?? noop,
    info: config?.info ?? console.log,
    warn: config?.warn ?? console.warn,
    error: config?.error ?? console.error
  };
}

/**
 * Create a configured MCP Server instance with the Stably tools registered,
 * but **do not** connect it to any transport yet.
 *
 * This is useful for embedding Stably into an existing MCP host that wishes
 * to control transports itself.
 */
export function createStablyServer(config: StablyMcpServerConfig = {}): Server {
  const logger = createLogger(config);

  const server = new Server(
    {
      name: config.name ?? 'stably-mcp',
      version: config.version ?? '0.1.0'
    },
    {
      // Stably exposes only tools; no resources, prompts, etc.
      capabilities: {
        tools: {}
      }
    }
  );

  //
  // Tool: stably.validate_pipeline
  //
  server.tool(
    'stably.validate_pipeline',
    'Validate a full pipeline instance (actions[]) against a Stably contract. Structural only.',
    {
      type: 'object',
      properties: {
        contract: {
          type: 'object',
          description: 'Runtime Stably contract JSON (compatible with StablyContract<TAction>).'
        },
        actions: {
          type: 'array',
          description: 'Pipeline instance: ordered array of domain actions.',
          items: {
            type: 'object',
            description: 'Domain action object (must include a "type" string; other fields are domain-defined).'
          }
        }
      },
      required: ['contract', 'actions'],
      additionalProperties: false
    },
    async (input: { contract: unknown; actions: unknown[] }) => {
      logger.debug('stably.validate_pipeline(input):', input);

      // We keep this structurally typed on the MCP layer; the contract/actions
      // are treated as opaque JSON that must satisfy the core type contracts
      // at runtime.
      const contract = input.contract as StablyContract<StablyBaseAction>;
      const actions = input.actions as PipelineInstance<StablyBaseAction>;

      const result = validatePipeline<StablyBaseAction, StablyContract<StablyBaseAction>>(actions, contract);

      logger.debug('stably.validate_pipeline(result):', result);

      // MCP transport doesn’t have a dedicated JSON type; we return a JSON
      // string so clients can parse as needed.
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(result)
          }
        ]
      };
    }
  );

  //
  // Tool: stably.validate_action
  //
  server.tool(
    'stably.validate_action',
    'Validate a single action against a Stably contract. Structural/local invariants only.',
    {
      type: 'object',
      properties: {
        contract: {
          type: 'object',
          description: 'Runtime Stably contract JSON (compatible with StablyContract<TAction>).'
        },
        action: {
          type: 'object',
          description: 'Single domain action to validate (must include a "type" string; other fields are domain-defined).'
        }
      },
      required: ['contract', 'action'],
      additionalProperties: false
    },
    async (input: { contract: unknown; action: unknown }) => {
      logger.debug('stably.validate_action(input):', input);

      const contract = input.contract as StablyContract<StablyBaseAction>;
      const action = input.action as StablyBaseAction;

      const result = validateAction<StablyBaseAction, StablyContract<StablyBaseAction>>(action, contract);

      logger.debug('stably.validate_action(result):', result);

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(result)
          }
        ]
      };
    }
  );

  //
  // Tool: stably.generate
  //
  // This is a *pure* wrapper around @stably/core/generate(actions):
  // - No contract knowledge
  // - No implicit validation
  // - No orchestration or retries
  //
  server.tool(
    'stably.generate',
    'Create and exhaust a deterministic generator over a pipeline instance (actions[]). No validation.',
    {
      type: 'object',
      properties: {
        actions: {
          type: 'array',
          description: 'Pipeline instance: ordered array of domain actions.',
          items: {
            type: 'object',
            description: 'Domain action object (must include a "type" string; other fields are domain-defined).'
          }
        }
      },
      required: ['actions'],
      additionalProperties: false
    },
    async (input: { actions: unknown[] }) => {
      logger.debug('stably.generate(input):', input);

      const actions = input.actions as PipelineInstance<StablyBaseAction>;

      // Exhaust the generator and materialize the sequence. This mirrors the
      // examples in @stably/core’s README.
      const sequence = Array.from(generate(actions));

      logger.debug('stably.generate(sequence):', sequence);

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({ sequence })
          }
        ]
      };
    }
  );

  logger.info('Stably MCP server initialized with tools: stably.validate_pipeline, stably.validate_action, stably.generate');

  return server;
}

/**
 * Convenience runtime entrypoint: create a Stably MCP server and connect it
 * to stdio using the default transport from @modelcontextprotocol/sdk.
 *
 * This matches the README sketch:
 *
 *   import { runStablyMcpServer } from '@stably/mcp';
 *
 *   runStablyMcpServer({
 *     // optional configuration
 *   });
 */
export async function runStablyMcpServer(config: StablyMcpServerConfig = {}): Promise<void> {
  const logger = createLogger(config);

  const server = createStablyServer(config);
  const transport = new StdioServerTransport();

  logger.info('Stably MCP server connecting over stdio…');

  await server.connect(transport);

  logger.info('Stably MCP server connected. Awaiting MCP client requests.');
}
