import { createError } from 'h3'

const typed = (statusCode: number, name: string) => (message: string) =>
  createError({ statusCode, statusMessage: name, message, data: { error: name, message } })

export const NotFound = typed(404, 'NotFoundError')
export const Authorization = typed(401, 'AuthorizationError')
export const Validation = typed(422, 'ValidationError')
export const Conflict = typed(409, 'ConflictError')
export const ExternalService = typed(502, 'ExternalServiceError')
