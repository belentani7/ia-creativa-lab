/**
 * Respuesta haptica y sonora estilo Apple (Taptic Engine).
 *
 * POR QUE EXISTE: la interfaz imita la sensacion de los controles fisicos de
 * Apple. En navegador no hay motor haptico real, asi que se usan dos cosas:
 * navigator.vibrate cuando el dispositivo lo soporta (Android), y un tono
 * corto generado con Web Audio como sustituto en el resto.
 *
 * SILENCIO POR DEFECTO EN ESCRITORIO: no se emite ningun sonido hasta que el
 * usuario lo activa de forma explicita. Un sitio que suena sin permiso se
 * cierra. toggleMute() devuelve el estado nuevo para que la UI lo refleje.
 */

type HapticKind = 'spring-snap' | 'crown-tick' | 'card-flip';

class AppleHaptics {
  private muted = true;
  private ctx: AudioContext | null = null;

  /** El AudioContext solo se crea tras un gesto del usuario (politica del navegador). */
  private context(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (this.muted) return null;
    if (!this.ctx) {
      const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!Ctor) return null;
      this.ctx = new Ctor();
    }
    if (this.ctx.state === 'suspended') void this.ctx.resume();
    return this.ctx;
  }

  private tone(freq: number, ms: number, gain: number): void {
    const ctx = this.context();
    if (!ctx) return;
    const osc = ctx.createOscillator();
    const amp = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.value = freq;
    // Rampa corta: ataque inmediato y caida exponencial, como un tick fisico.
    amp.gain.setValueAtTime(gain, ctx.currentTime);
    amp.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + ms / 1000);
    osc.connect(amp).connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + ms / 1000);
  }

  private buzz(pattern: number | number[]): void {
    if (typeof navigator === 'undefined') return;
    if (this.muted) return;
    // vibration API no existe en iOS; si falta, simplemente no pasa nada.
    navigator.vibrate?.(pattern);
  }

  private play(kind: HapticKind, intensity = 1): void {
    switch (kind) {
      case 'spring-snap':
        this.buzz(12);
        this.tone(880, 70, 0.05 * intensity);
        break;
      case 'crown-tick':
        this.buzz(6);
        this.tone(1320, 28, 0.03 * intensity);
        break;
      case 'card-flip':
        this.buzz([8, 18, 8]);
        this.tone(660, 50, 0.04 * intensity);
        break;
    }
  }

  playSpringSnap(): void {
    this.play('spring-snap');
  }

  /**
   * Tick de corona digital. `intensity` ajusta el volumen; 1 es el nominal.
   * Los valores fuera de rango se recortan para no saturar el altavoz.
   */
  playCrownTick(intensity = 1): void {
    this.play('crown-tick', Math.max(0.2, Math.min(2, intensity)));
  }

  playCardFlip(): void {
    this.play('card-flip');
  }

  isMuted(): boolean {
    return this.muted;
  }

  /**
   * Cambia el estado de silencio y devuelve el nuevo valor.
   * Sin argumento alterna; con argumento fija el valor pedido.
   */
  toggleMute(enable?: boolean): boolean {
    this.muted = enable === undefined ? !this.muted : !enable;
    if (this.muted && this.ctx) {
      void this.ctx.suspend();
    }
    if (!this.muted) this.tone(880, 40, 0.04);
    return !this.muted;
  }
}

export const appleHaptics = new AppleHaptics();
