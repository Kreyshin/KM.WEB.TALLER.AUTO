<script setup lang="ts">
import KmBadge from '@/components/ui/KmBadge.vue'
import KmCatalogo from '@/components/ui/KmCatalogo.vue'
import KmCheckbox from '@/components/ui/KmCheckbox.vue'
import KmField from '@/components/ui/KmField.vue'
import KmInput from '@/components/ui/KmInput.vue'
import KmSelect from '@/components/ui/KmSelect.vue'
import KmSwitch from '@/components/ui/KmSwitch.vue'
import { etiquetasRol } from '@/components/layout/navegacion'
import { usuariosService } from '@/services/usuarios.service'
import type { Especialidad, Rol, Usuario } from '@/types'
import type { ColumnaTabla, OpcionSelect, TonoTaller } from '@/types/ui'
import { etiquetaEspecialidad } from '@/utils/formato'

/**
 * Personal del taller. Los permisos finos viven en el ERP; aquí va el rol.
 *
 * Las especialidades solo aplican al técnico, y no son burocracia: son lo que
 * permite repartir el trabajo con criterio en vez de por turno.
 */

const columnas: ColumnaTabla[] = [
  { clave: 'nombre', etiqueta: 'Persona', ordenable: true },
  { clave: 'email', etiqueta: 'Correo', ordenable: true },
  { clave: 'rol', etiqueta: 'Rol', clase: 'w-56' },
  { clave: 'especialidades', etiqueta: 'Especialidades', clase: 'w-72' },
]

const roles: OpcionSelect[] = (['admin', 'asesor', 'tecnico', 'almacen'] as Rol[]).map((r) => ({
  valor: r,
  etiqueta: etiquetasRol[r],
}))

const tonoRol: Record<Rol, TonoTaller> = {
  admin: 'acero',
  asesor: 'ambar',
  tecnico: 'verde',
  almacen: 'neutro',
}

const especialidades: Especialidad[] = [
  'mecanica',
  'electricidad',
  'electronica',
  'suspension',
  'frenos',
  'planchado',
  'pintura',
  'aire',
]

const nuevo = (): Omit<Usuario, 'id'> => ({
  nombre: '',
  email: '',
  rol: 'tecnico',
  activo: true,
  especialidades: [],
})

function validar(u: Omit<Usuario, 'id'>): Record<string, string> {
  const errores: Record<string, string> = {}
  if (!u.nombre.trim()) errores.nombre = 'El nombre es obligatorio.'
  if (!u.email.trim()) errores.email = 'El correo es obligatorio.'
  if (u.rol === 'tecnico' && !u.especialidades?.length) {
    errores.especialidades = 'Un técnico sin especialidad no puede recibir trabajo.'
  }
  return errores
}

/** Marca o desmarca una especialidad sin perder la referencia del borrador. */
function alternar(lista: Especialidad[] | undefined, e: Especialidad): Especialidad[] {
  const actuales = lista ?? []
  return actuales.includes(e) ? actuales.filter((x) => x !== e) : [...actuales, e]
}
</script>

<template>
  <KmCatalogo
    titulo="Usuarios y roles"
    subtitulo="Quién entra al sistema y qué parte del taller gestiona."
    entidad="usuario"
    :servicio="usuariosService"
    :columnas="columnas"
    :nuevo="nuevo"
    :validar="validar"
    :orden="{ campo: 'nombre', direccion: 'asc' }"
    :nombre-de="(u: Usuario) => u.nombre"
  >
    <template #col-nombre="{ fila }">
      <span class="font-medium text-tinta">{{ fila.nombre }}</span>
    </template>
    <template #col-email="{ fila }">
      <span class="font-mono text-xs text-tenue">{{ fila.email }}</span>
    </template>
    <template #col-rol="{ fila }">
      <KmBadge :tono="tonoRol[fila.rol]" punto>{{ etiquetasRol[fila.rol] }}</KmBadge>
    </template>
    <template #col-especialidades="{ fila }">
      <span v-if="!fila.especialidades?.length" class="text-xs text-tenue">—</span>
      <span v-else class="flex flex-wrap gap-1">
        <KmBadge v-for="e in fila.especialidades" :key="e" tono="neutro">
          {{ etiquetaEspecialidad[e] }}
        </KmBadge>
      </span>
    </template>

    <template #formulario="{ borrador, errores }">
      <KmField v-slot="{ id, invalido }" label="Nombre" :error="errores.nombre" requerido>
        <KmInput :id="id" v-model="borrador.nombre" :invalido="invalido" />
      </KmField>
      <KmField v-slot="{ id, invalido }" label="Correo" :error="errores.email" requerido>
        <KmInput :id="id" v-model="borrador.email" type="email" :invalido="invalido" />
      </KmField>
      <KmField v-slot="{ id }" label="Rol">
        <KmSelect :id="id" v-model="borrador.rol" :opciones="roles" />
      </KmField>

      <KmField
        v-if="borrador.rol === 'tecnico'"
        label="Especialidades"
        :error="errores.especialidades"
        ayuda="Con qué trabajos puede contar el taller al repartir."
      >
        <div class="grid grid-cols-2 gap-x-4 gap-y-2.5">
          <KmCheckbox
            v-for="e in especialidades"
            :key="e"
            :model-value="borrador.especialidades?.includes(e) ?? false"
            @update:model-value="borrador.especialidades = alternar(borrador.especialidades, e)"
          >
            {{ etiquetaEspecialidad[e] }}
          </KmCheckbox>
        </div>
      </KmField>

      <KmSwitch
        v-model="borrador.activo"
        etiqueta="Cuenta activa"
        descripcion="Una cuenta inactiva no puede iniciar sesión."
      />
    </template>
  </KmCatalogo>
</template>
