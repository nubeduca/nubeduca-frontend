import { archivoHandlers } from './archivos'
import { calificacionHandlers } from './calificaciones'
import { contenidoHandlers } from './contenidos'
import { cursoHandlers } from './cursos'
import { evaluacionHandlers } from './evaluaciones'
import { notificacionHandlers } from './notificaciones'
import { usuarioHandlers } from './usuarios'

export const handlers = [
  ...usuarioHandlers,
  ...cursoHandlers,
  ...archivoHandlers,
  ...contenidoHandlers,
  ...evaluacionHandlers,
  ...calificacionHandlers,
  ...notificacionHandlers,
]
