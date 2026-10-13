<script setup lang="ts">
import FormularioAcceso from '@/components/acceso/FormularioAcceso.vue'
import MarcaTorque from '@/components/marca/MarcaTorque.vue'
import KmIcono from '@/components/ui/KmIcono.vue'
import novum from '@/assets/karma/karma-novum-login.svg'
import systems from '@/assets/karma/karma-systems-login.svg'
</script>

<template>
  <main class="torque-login">
    <section class="presentacion" aria-labelledby="torque-lema">
      <header class="marca">
        <MarcaTorque :tamano="44" />
        <div>
          <p class="nombre">Torque</p>
          <p class="descriptor">Gestión de taller</p>
        </div>
      </header>
      <div class="historia">
        <div class="orbita" aria-hidden="true">
          <div class="anillo anillo-uno" />
          <div class="anillo anillo-dos" />
          <div class="anillo anillo-tres" />
          <div class="nucleo"><MarcaTorque :tamano="112" /></div>
          <div class="modulo ordenes">
            <div class="modulo-titulo"><KmIcono nombre="conteo" /> Órdenes</div>
            <div class="barras"><i /><i /><i /><i /></div>
          </div>
          <div class="modulo bahias">
            <div class="modulo-titulo"><KmIcono nombre="procesar" /> Bahías</div>
            <div class="grafico"><i /></div>
          </div>
          <div class="modulo repuestos">
            <div class="modulo-titulo"><KmIcono nombre="caja" /> Repuestos</div>
            <div class="puntos"><i /><i /><i /></div>
          </div>
          <div class="modulo facturacion">
            <div class="modulo-titulo"><KmIcono nombre="estante" /> Facturación</div>
            <div class="lineas"><i /><i /><i /></div>
          </div>
          <span class="destello uno" /><span class="destello dos" />
        </div>
        <p class="eyebrow">El pulso de tu taller</p>
        <h1 id="torque-lema">Cada vehículo.<br />Todo <span>bajo control.</span></h1>
        <p class="descripcion">
          Órdenes, repuestos y personas conectadas<br class="salto" />
          en un solo espacio de trabajo.
        </p>
      </div>
      <footer class="pie-presentacion">
        <div class="atribucion">
          <img :src="novum" alt="" /><span>Una plataforma de <strong>Karma Novum</strong></span>
        </div>
        <span class="valores">Conexión · Control · Servicio</span>
      </footer>
    </section>
    <section class="acceso" aria-labelledby="acceso-titulo">
      <div class="tarjeta">
        <header class="marca marca-tarjeta">
          <MarcaTorque :tamano="39" />
          <div>
            <p class="nombre">Torque</p>
            <p class="descriptor">Acceso a tu taller</p>
          </div>
        </header>
        <div class="bienvenida">
          <p class="eyebrow">Bienvenido a tu taller</p>
          <h2 id="acceso-titulo">Todo empieza aquí.</h2>
          <p>Ingresa a tu espacio de trabajo.</p>
        </div>
        <FormularioAcceso sobre-oscuro accion="Ingresar al taller" />
        <p class="seguridad">
          <KmIcono nombre="candado" tamano="xs" /> Tu equipo. Tus accesos. Tu taller.
        </p>
      </div>
      <footer class="pie-acceso">
        <img :src="systems" alt="" /><span>Karma Systems</span
        ><span class="division">Desarrollo de sistemas</span>
      </footer>
    </section>
  </main>
</template>

<style scoped>
.torque-login {
  min-height: 100svh;
  display: grid;
  grid-template-columns: 1.05fr 1fr;
  background: #101725;
  color: #e8edf5;
  font-family: var(--font-sans, 'Inter', sans-serif);
}
.presentacion {
  position: relative;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  padding: 36px 42px 24px;
  overflow: hidden;
  background: radial-gradient(ellipse at 52% 42%, #17263a70, transparent 55%), #0a111c;
}
.marca {
  display: flex;
  align-items: center;
  gap: 11px;
}
.nombre {
  font-size: 21px;
  line-height: 1.1;
  font-weight: 650;
  letter-spacing: -0.6px;
}
.descriptor {
  margin-top: 7px;
  font-size: 8px;
  font-weight: 650;
  text-transform: uppercase;
  letter-spacing: 2px;
  color: #93a4bb;
}
.historia {
  width: 100%;
  max-width: 440px;
  margin: 38px auto 60px;
}
.orbita {
  position: relative;
  width: 400px;
  height: 285px;
  margin: 0 auto 28px;
}
.anillo {
  position: absolute;
  border: 1px solid #56708e16;
  border-radius: 50%;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
}
.anillo-uno {
  width: 210px;
  height: 210px;
}
.anillo-dos {
  width: 270px;
  height: 270px;
}
.anillo-tres {
  width: 330px;
  height: 330px;
}
.nucleo {
  position: absolute;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
  width: 110px;
  height: 110px;
  display: grid;
  place-items: center;
  border: 1px solid #546a8340;
  border-radius: 24px;
  background: linear-gradient(145deg, #223449, #101b2b);
  box-shadow: 0 0 55px #36577718;
}
.modulo {
  position: absolute;
  width: 112px;
  height: 84px;
  padding: 13px;
  border: 1px solid #687c9225;
  border-radius: 12px;
  background: linear-gradient(135deg, #1f2c3d, #141e2d);
  box-shadow: 0 12px 28px #00000018;
}
.modulo-titulo {
  display: flex;
  align-items: center;
  gap: 6px;
  color: #b5c3d6;
  font-size: 9px;
  font-weight: 550;
}
.modulo-titulo :deep(svg) {
  color: #ff5c70;
  width: 13px;
  height: 13px;
}
.ordenes {
  left: 21px;
  top: 24px;
  transform: rotate(-7deg);
}
.bahias {
  right: 12px;
  top: 28px;
  transform: rotate(8deg);
}
.repuestos {
  left: 31px;
  bottom: 18px;
  transform: rotate(-5deg);
}
.facturacion {
  right: 21px;
  bottom: 12px;
  transform: rotate(6deg);
}
.barras {
  display: flex;
  gap: 5px;
  align-items: flex-end;
  height: 29px;
  margin-top: 9px;
}
.barras i {
  width: 13px;
  height: 12px;
  background: #d52842;
  border-radius: 2px;
}
.barras i:nth-child(2) {
  height: 18px;
}
.barras i:nth-child(3) {
  height: 23px;
}
.barras i:nth-child(4) {
  height: 29px;
  background: #ff5c70;
}
.grafico {
  margin-top: 14px;
  height: 23px;
  border-bottom: 2px solid #ff5c70;
  background: linear-gradient(0deg, #fd263f28, transparent);
  clip-path: polygon(0 50%, 33% 65%, 62% 36%, 100% 0, 100% 100%, 0 100%);
}
.puntos {
  display: flex;
  gap: 7px;
  margin-top: 14px;
}
.puntos i {
  width: 17px;
  height: 17px;
  border-radius: 50%;
  border: 1px solid #7c8fa060;
  background: #56708e30;
}
.lineas {
  display: grid;
  gap: 5px;
  margin-top: 12px;
}
.lineas i {
  height: 3px;
  background: #63768e50;
  border-radius: 2px;
}
.lineas i:nth-child(2) {
  width: 65%;
}
.destello {
  position: absolute;
  width: 4px;
  height: 4px;
  border-radius: 50%;
  background: #ff5c70;
  box-shadow: 0 0 10px #fd263f;
}
.uno {
  top: 3px;
  left: 177px;
}
.dos {
  bottom: 2px;
  right: 128px;
}
.eyebrow {
  color: #ff5c70;
  font-size: 9px;
  font-weight: 700;
  letter-spacing: 1.8px;
  text-transform: uppercase;
}
h1 {
  margin-top: 20px;
  font-size: clamp(36px, 3.4vw, 52px);
  line-height: 1.12;
  letter-spacing: -1.9px;
  font-weight: 700;
}
h1 span {
  color: #ff5c70;
}
.descripcion {
  margin-top: 20px;
  color: #93a4bb;
  font-size: 13px;
  line-height: 1.85;
}
.pie-presentacion {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
  color: #8190a6;
  font-size: 14px;
}
.atribucion {
  display: flex;
  align-items: center;
  gap: 12px;
}
.atribucion img {
  width: 26px;
  height: 26px;
}
.atribucion strong {
  font-weight: 600;
}
.valores {
  font-size: 10px;
  text-transform: uppercase;
  letter-spacing: 1.7px;
  white-space: nowrap;
}
.acceso {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 76px 32px;
  background: radial-gradient(ellipse at center, #1a243330, transparent 65%), #101725;
}
.tarjeta {
  position: relative;
  width: 100%;
  max-width: 374px;
  padding: 30px;
  border: 1px solid #75839826;
  border-radius: 17px;
  background: linear-gradient(145deg, #192231, #131c2a);
  box-shadow: 0 18px 60px #00000016;
  overflow: hidden;
}
.tarjeta::before,
.tarjeta::after {
  content: '';
  position: absolute;
  background: #fd263f;
}
.tarjeta::before {
  top: 0;
  left: 24px;
  width: 56px;
  height: 1px;
}
.tarjeta::after {
  bottom: 21px;
  left: 0;
  width: 1px;
  height: 30px;
}
.marca-tarjeta {
  padding-bottom: 24px;
  border-bottom: 1px solid #75839812;
}
.marca-tarjeta .nombre {
  font-size: 16px;
}
.marca-tarjeta .descriptor {
  font-size: 6px;
  letter-spacing: 1.5px;
  margin-top: 6px;
}
.bienvenida {
  margin: 26px 0 27px;
}
.bienvenida .eyebrow {
  font-size: 8px;
  letter-spacing: 1.6px;
}
h2 {
  font-size: 27px;
  font-weight: 650;
  letter-spacing: -0.9px;
  line-height: 1.25;
  margin-top: 12px;
}
.bienvenida > p:last-child {
  font-size: 12px;
  color: #93a4bb;
  margin-top: 11px;
}
.seguridad {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 8px;
  margin-top: 23px;
  padding-top: 19px;
  border-top: 1px solid #75839812;
  color: #8190a6;
  font-size: 9px;
}
.pie-acceso {
  position: absolute;
  bottom: 24px;
  display: flex;
  align-items: center;
  gap: 10px;
  color: #8190a6;
  font-size: 13px;
}
.pie-acceso img {
  width: 21px;
  height: 21px;
}
.division {
  color: #65758b;
  margin-left: 12px;
}
@media (min-width: 1600px) {
  .presentacion {
    padding: 44px 58px 28px;
  }
  .historia {
    max-width: 480px;
  }
  .orbita {
    margin-bottom: 38px;
  }
}
@media (max-width: 1100px) {
  .presentacion {
    padding: 28px 28px 22px;
  }
  .historia {
    max-width: 350px;
  }
  .orbita {
    transform: scale(0.88);
    transform-origin: center;
    margin-left: -25px;
  }
  .valores {
    display: none;
  }
}
@media (max-width: 760px) {
  .torque-login {
    grid-template-columns: 1fr;
  }
  .presentacion {
    display: none;
  }
  .acceso {
    min-height: 100svh;
    padding: 36px 20px 90px;
  }
  .tarjeta {
    max-width: 390px;
  }
  .pie-acceso {
    bottom: 28px;
  }
}
@media (max-width: 720px) {
  .pie-acceso {
    font-size: 11px;
    gap: 8px;
  }
  .division {
    margin-left: 4px;
  }
}
@media (max-width: 360px) {
  .acceso {
    padding-inline: 12px;
  }
  .tarjeta {
    padding: 24px;
  }
  h2 {
    font-size: 25px;
  }
}
@media (max-height: 740px) and (min-width: 761px) {
  .historia {
    margin-top: 10px;
    margin-bottom: 25px;
  }
  .orbita {
    height: 235px;
    transform: scale(0.82);
    margin-bottom: 6px;
  }
  h1 {
    font-size: 40px;
  }
  .descripcion {
    margin-top: 15px;
  }
}
</style>
