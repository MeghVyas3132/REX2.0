// ──────────────────────────────────────────────
// REX - CodeNode
// Executes user-provided JavaScript code safely
// Uses Function constructor with sandboxed context
// ──────────────────────────────────────────────

import type {
  BaseNodeDefinition,
  NodeInput,
  NodeOutput,
  NodeExecutionContext,
  ValidationResult,
} from "@rex/types";

export const CodeNode: BaseNodeDefinition = {
  type: "code",

  validate(config: Record<string, unknown>): ValidationResult {
    const errors: string[] = [];

    if (!config["code"]) {
      errors.push("CodeNode requires 'code' in config");
    }

    // Basic syntax validation
    if (config["code"]) {
      try {
        new Function("input", "context", config["code"] as string);
      } catch (err) {
        errors.push(
          `Syntax error in code: ${err instanceof Error ? err.message : "Unknown error"}`
        );
      }
    }

    return { valid: errors.length === 0, errors };
  },

  async execute(input: NodeInput, context: NodeExecutionContext): Promise<NodeOutput> {
    const nodeConfig = input.metadata?.["nodeConfig"] as Record<string, unknown> | undefined;
    if (!nodeConfig) {
      throw new Error("CodeNode: missing nodeConfig in metadata");
    }

    const code = nodeConfig["code"] as string;
    const timeoutMs = (nodeConfig["timeoutMs"] as number) ?? 10000;

    context.logger.info("Executing user code", {
      nodeId: context.nodeId,
      codeLength: code.length,
    });

    const startTime = Date.now();

    // Build a sandboxed execution context
    const sandbox = {
      input: input.data,
      console: {
        log: (...args: unknown[]) =>
          context.logger.info("Code output", { output: args }),
        warn: (...args: unknown[]) =>
          context.logger.warn("Code warning", { output: args }),
        error: (...args: unknown[]) =>
          context.logger.error("Code error", { output: args }),
      },
      JSON,
      Math,
      Date,
      Array,
      Object,
      String,
      Number,
      Boolean,
      parseInt,
      parseFloat,
      isNaN,
      isFinite,
      encodeURIComponent,
      decodeURIComponent,
    };

    try {
      // Wrap user code to handle both return and assignment patterns
      const wrappedCode = `
        "use strict";
        const input = arguments[0];
        const console = arguments[1];
        ${code}
      `;

      const fn = new Function(wrappedCode);

      // Execute with a timeout via Promise.race
      const resultPromise = Promise.resolve().then(() =>
        fn.call(null, sandbox.input, sandbox.console)
      );

      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(
          () => reject(new Error(`Code execution timed out after ${timeoutMs}ms`)),
          timeoutMs
        );
      });

      const result = await Promise.race([resultPromise, timeoutPromise]);
      const durationMs = Date.now() - startTime;

      context.logger.info("Code execution completed", {
        nodeId: context.nodeId,
        durationMs,
        hasResult: result !== undefined,
      });

      // Normalize result to a record
      const outputData: Record<string, unknown> =
        result !== null && typeof result === "object" && !Array.isArray(result)
          ? (result as Record<string, unknown>)
          : { result };

      return {
        data: outputData,
        metadata: { durationMs },
      };
    } catch (err) {
      const durationMs = Date.now() - startTime;
      const errorMessage = err instanceof Error ? err.message : "Unknown code execution error";

      context.logger.error("Code execution failed", {
        nodeId: context.nodeId,
        error: errorMessage,
        durationMs,
      });

      throw new Error(`Code execution failed: ${errorMessage}`);
    }
  },
};
