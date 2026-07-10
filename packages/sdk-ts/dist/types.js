"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AgentShareError = void 0;
class AgentShareError extends Error {
    status;
    details;
    constructor(message, status, details) {
        super(message);
        this.name = "AgentShareError";
        this.status = status;
        this.details = details;
    }
}
exports.AgentShareError = AgentShareError;
