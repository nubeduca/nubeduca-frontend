import { contenidoHandlers } from './contenidos'
import { cursoHandlers } from './cursos'
import { notificacionHandlers } from './notificaciones'
import { usuarioHandlers } from './usuarios'

export const handlers = [
  ...usuarioHandlers,
  ...cursoHandlers,
  ...contenidoHandlers,
  ...notificacionHandlers,
]
