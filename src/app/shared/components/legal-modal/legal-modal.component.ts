import { CommonModule } from '@angular/common';
import { Component, HostListener, signal, OnInit } from '@angular/core';

type LegalTab = 'terminos' | 'privacidad';

const TERMINOS_TEXT = `
<h2>Términos y Condiciones de SIGMA Pro</h2>
<p class="meta">Última actualización: Septiembre 2026</p>

<p>¡Bienvenido/a a SIGMA Pro! Al crear tu cuenta aceptas lo siguiente:</p>

<h3>1. Qué es SIGMA Pro</h3>
<p>Es una plataforma para gestionar vehículos, clientes, fichas de mantención y alertas, conectando Clientes, Mecánicos Independientes y Talleres Mecánicos.</p>

<h3>2. Tu cuenta es personal</h3>
<p>Debes ser mayor de 17 años, entregar datos verdaderos (nombre, correo, RUT, etc.) y cuidar tu contraseña. Eres responsable de lo que se haga con tu cuenta.</p>

<h3>3. Documentos verdaderos</h3>
<p>Si eres Mecánico Independiente o Taller, te pediremos documentos (cédula, certificado de antecedentes, patente comercial, comprobante de domicilio). Deben ser auténticos y vigentes. Podemos suspender cuentas con información falsa.</p>

<h3>4. Uso correcto</h3>
<p>Te comprometes a usar la plataforma solo para fines lícitos: registrar tus vehículos, mantenciones reales y comunicarte con respeto. Está prohibido suplantar a otros, subir archivos falsos o intentar dañar el sistema.</p>

<h3>5. Servicios de taller</h3>
<p>Las mantenciones, diagnósticos y reparaciones son responsabilidad de quien las realiza (mecánico / taller). SIGMA Pro facilita el registro y seguimiento, pero no reemplaza la garantía legal de cada servicio.</p>

<h3>6. Disponibilidad</h3>
<p>Hacemos lo posible por mantener el servicio siempre activo, pero puede haber pausas por mantención o mejoras. Podremos actualizar funciones avisando oportunamente.</p>

<h3>7. Suspensión</h3>
<p>Podemos suspender o eliminar cuentas que incumplan estos términos, entreguen documentos falsos o hagan mal uso de la plataforma.</p>

<p class="contact">Al marcar “Acepto”, confirmas que leíste, entendiste y aceptas estos Términos.<br>Contacto: <a href="mailto:soporte@sigmapro.cl">soporte@sigmapro.cl</a></p>
`;

const PRIVACIDAD_TEXT = `
<h2>Política de Privacidad de SIGMA Pro</h2>
<p class="meta">En cumplimiento de la Ley N° 19.628 sobre Protección de la Vida Privada (Chile).</p>

<p>Tu privacidad nos importa. En simple:</p>

<h3>1. Qué datos guardamos</h3>
<p>Nombre, correo, teléfono, RUT, fecha de nacimiento, datos de tu vehículo y, según tu rol, documentos como cédula, certificado de antecedentes o datos del taller. Nunca te pediremos datos innecesarios.</p>

<h3>2. Para qué los usamos</h3>
<p>Solo para crear tu cuenta, verificar tu identidad, gestionar tus vehículos y mantenciones, enviarte alertas importantes y mejorar el servicio.</p>

<h3>3. Tus documentos están protegidos</h3>
<p>Los archivos que subes se usan únicamente para validación y no se comparten públicamente. Solo el personal autorizado puede revisarlos.</p>

<h3>4. No vendemos tus datos</h3>
<p>No vendemos ni arrendamos tu información. Solo la compartimos si es necesario para prestar el servicio (ej. mostrar tu vehículo a tu taller asignado) o si la ley lo exige.</p>

<h3>5. Tus derechos</h3>
<p>Puedes pedir en cualquier momento acceder, corregir o eliminar tus datos escribiendo a <a href="mailto:privacidad@sigmapro.cl">privacidad@sigmapro.cl</a>. Responderemos a la brevedad.</p>

<h3>6. Seguridad</h3>
<p>Usamos contraseñas cifradas y accesos protegidos. Aun así, te pedimos no compartir tu clave con nadie.</p>

<p class="contact">Al marcar “Acepto”, autorizas el tratamiento de tus datos según esta política.</p>
`;

@Component({
  selector: 'sigma-legal-modal',
  standalone: true,
  imports: [CommonModule],
  template: `
    @if (isOpen()) {
      <div class="legal-modal-overlay" (click)="cerrar()">
        <div class="legal-modal" (click)="$event.stopPropagation()" [class.scrolled-to-bottom]="haLlegadoAlFinal()">
          <header class="legal-modal__header">
            <h2>Documentos legales</h2>
            <button class="legal-modal__close" (click)="cerrar()" aria-label="Cerrar">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          </header>

          <nav class="legal-modal__tabs" role="tablist">
            <button
              role="tab"
              class="legal-modal__tab"
              [class.active]="activeTab() === 'terminos'"
              (click)="cambiarTab('terminos')"
              aria-selected="true"
            >
              Términos y Condiciones
            </button>
            <button
              role="tab"
              class="legal-modal__tab"
              [class.active]="activeTab() === 'privacidad'"
              (click)="cambiarTab('privacidad')"
              aria-selected="false"
            >
              Política de Privacidad
            </button>
          </nav>

          <div class="legal-modal__content-wrapper">
            <div
              #contentScroll
              class="legal-modal__content"
              (scroll)="onScroll($event)"
            >
              @if (activeTab() === 'terminos') {
                <div class="legal-modal__text" [innerHTML]="TERMINOS_TEXT"></div>
              } @else {
                <div class="legal-modal__text" [innerHTML]="PRIVACIDAD_TEXT"></div>
              }

              <div class="legal-modal__scroll-hint" [class.hidden]="haLlegadoAlFinal()">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <polyline points="6 9 12 15 18 9"></polyline>
                </svg>
                <span>Desplázate hasta el final para continuar</span>
              </div>
            </div>
          </div>

          <footer class="legal-modal__footer">
            <button
              class="sigma-btn sigma-btn--secondary"
              (click)="cerrar()"
              [disabled]="!haLlegadoAlFinal()"
            >
              He leído y acepto
            </button>
          </footer>
        </div>
      </div>
    }
  `,
  styles: [`
    .legal-modal-overlay {
      position: fixed;
      inset: 0;
      background: rgba(0, 0, 0, 0.6);
      backdrop-filter: blur(4px);
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 1rem;
      z-index: 1000;
      animation: fadeIn 0.2s ease;
    }

    .legal-modal {
      width: 100%;
      max-width: 520px;
      max-height: 85vh;
      background: var(--sigma-white);
      border-radius: var(--sigma-radius-lg);
      border: 1px solid rgba(255, 128, 0, 0.15);
      box-shadow: var(--sigma-shadow-lg);
      display: flex;
      flex-direction: column;
      overflow: hidden;
      animation: slideUp 0.3s ease;
    }

    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }

    @keyframes slideUp {
      from { opacity: 0; transform: translateY(20px); }
      to { opacity: 1; transform: translateY(0); }
    }

    .legal-modal__header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 1rem 1.25rem;
      border-bottom: 1px solid var(--sigma-gray-light);
      flex-shrink: 0;
    }

    .legal-modal__header h2 {
      font-size: 1.1rem;
      font-weight: 700;
      color: var(--sigma-black);
    }

    .legal-modal__close {
      width: 36px;
      height: 36px;
      border-radius: 50%;
      border: none;
      background: var(--sigma-gray-light);
      color: var(--sigma-gray-medium);
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: all var(--sigma-transition);
    }

    .legal-modal__close:hover {
      background: var(--sigma-gray);
      color: var(--sigma-black);
    }

    .legal-modal__tabs {
      display: flex;
      border-bottom: 1px solid var(--sigma-gray-light);
      flex-shrink: 0;
    }

    .legal-modal__tab {
      flex: 1;
      padding: 0.85rem 1rem;
      border: none;
      background: transparent;
      font-size: 0.85rem;
      font-weight: 600;
      color: var(--sigma-gray-medium);
      cursor: pointer;
      position: relative;
      transition: color var(--sigma-transition);
    }

    .legal-modal__tab::after {
      content: '';
      position: absolute;
      bottom: -1px;
      left: 0;
      right: 0;
      height: 2px;
      background: var(--sigma-mint-dark);
      transform: scaleX(0);
      transform-origin: center;
      transition: transform var(--sigma-transition);
    }

    .legal-modal__tab:hover {
      color: var(--sigma-mint-dark);
    }

    .legal-modal__tab.active {
      color: var(--sigma-mint-dark);
    }

    .legal-modal__tab.active::after {
      transform: scaleX(1);
    }

    .legal-modal__content-wrapper {
      flex: 1;
      overflow: hidden;
      position: relative;
    }

    .legal-modal__content {
      height: 100%;
      overflow-y: auto;
      padding: 1.25rem;
      max-height: calc(85vh - 160px);
    }

    .legal-modal__content::-webkit-scrollbar {
      width: 6px;
    }
    .legal-modal__content::-webkit-scrollbar-thumb {
      background: var(--sigma-gray);
      border-radius: 3px;
    }

    .legal-modal__text {
      font-size: 0.85rem;
      line-height: 1.6;
      color: var(--sigma-gray-dark);
    }

    .legal-modal__text h2 {
      font-size: 1.1rem;
      font-weight: 700;
      color: var(--sigma-black);
      margin-bottom: 0.25rem;
    }

    .legal-modal__text h3 {
      font-size: 0.9rem;
      font-weight: 700;
      color: var(--sigma-black);
      margin-top: 1.25rem;
      margin-bottom: 0.5rem;
    }

    .legal-modal__text p {
      margin-bottom: 0.75rem;
    }

    .legal-modal__text .meta {
      font-size: 0.8rem;
      color: var(--sigma-gray-medium);
      margin-bottom: 1rem;
      padding-bottom: 0.75rem;
      border-bottom: 1px solid var(--sigma-gray-light);
    }

    .legal-modal__text .contact {
      margin-top: 1.5rem;
      padding-top: 1rem;
      border-top: 1px solid var(--sigma-gray-light);
      font-weight: 500;
      color: var(--sigma-black);
    }

    .legal-modal__text a {
      color: var(--sigma-mint-dark);
      font-weight: 600;
    }

    .legal-modal__text a:hover {
      color: var(--sigma-orange);
    }

    .legal-modal__scroll-hint {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
      padding: 1rem;
      color: var(--sigma-mint-dark);
      font-size: 0.8rem;
      font-weight: 600;
      animation: bounce 1.5s infinite;
    }

    .legal-modal__scroll-hint.hidden {
      opacity: 0;
      pointer-events: none;
    }

    @keyframes bounce {
      0%, 100% { transform: translateY(0); }
      50% { transform: translateY(4px); }
    }

    .legal-modal__footer {
      padding: 1rem 1.25rem;
      border-top: 1px solid var(--sigma-gray-light);
      flex-shrink: 0;
      background: var(--sigma-gray-light);
    }

    .legal-modal__footer .sigma-btn {
      width: 100%;
      padding: 0.75rem;
      font-weight: 600;
    }

    .legal-modal__footer .sigma-btn:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    @media (max-width: 480px) {
      .legal-modal {
        max-height: 95vh;
        border-radius: var(--sigma-radius-lg) var(--sigma-radius-lg) 0 0;
      }

      .legal-modal__content {
        max-height: calc(95vh - 160px);
      }
    }
  `]
})
export class LegalModalComponent implements OnInit {
  readonly isOpen = signal(false);
  readonly activeTab = signal<LegalTab>('terminos');
  readonly haLlegadoAlFinal = signal(false);
  readonly scrollPosition = signal(0);
  readonly contentHeight = signal(0);

  protected readonly TERMINOS_TEXT = TERMINOS_TEXT;
  protected readonly PRIVACIDAD_TEXT = PRIVACIDAD_TEXT;

  private resolvePromise!: (value: boolean) => void;
  private promise!: Promise<boolean>;

  ngOnInit(): void {
    this.promise = new Promise(resolve => {
      this.resolvePromise = resolve;
    });
  }

  abrir(): Promise<boolean> {
    this.isOpen.set(true);
    this.activeTab.set('terminos');
    this.haLlegadoAlFinal.set(false);
    this.scrollPosition.set(0);
    return this.promise;
  }

  cerrar(): void {
    this.isOpen.set(false);
    this.resolvePromise?.(this.haLlegadoAlFinal());
    // Crear nueva promesa para próxima apertura
    this.promise = new Promise(resolve => {
      this.resolvePromise = resolve;
    });
  }

  cambiarTab(tab: LegalTab): void {
    this.activeTab.set(tab);
    this.haLlegadoAlFinal.set(false);
    this.scrollPosition.set(0);
    // Forzar recálculo en próximo tick
    setTimeout(() => this.calcularScrollMax(), 0);
  }

  onScroll(event: Event): void {
    const target = event.target as HTMLElement;
    const { scrollTop, scrollHeight, clientHeight } = target;
    this.scrollPosition.set(scrollTop);
    this.contentHeight.set(scrollHeight);

    const haLlegado = scrollTop + clientHeight >= scrollHeight - 10;
    this.haLlegadoAlFinal.set(haLlegado);
  }

  private calcularScrollMax(): void {
    // Se recalculará en el próximo onScroll
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    if (this.isOpen()) this.cerrar();
  }
}