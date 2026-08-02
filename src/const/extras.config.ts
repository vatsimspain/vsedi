type ExtraBase = {
  id: string;
  name: string;
  description: string;
  version?: string;
  /** Registry DisplayName used to detect if already installed */
  detectionName?: string;
  mandatory?: boolean;
};

export type ExtraConfig =
  | (ExtraBase & {
      source: 'github';
      githubRepo: string;
      releaseTag: string;
      assetPattern: RegExp;
      installArgs: string[];
    })
  | (ExtraBase & {
      source: 'url';
      downloadUrl: string;
      installArgs: string[];
    })
  | (ExtraBase & {
      source: 'local';
      localPath: string;
      installArgs: string[];
    })
  | (ExtraBase & {
      source: 'font';
      assetPath: string;
    });

export const EXTRAS: ExtraConfig[] = [
  {
    id: 'euroscope-font',
    name: 'Fuente Euroscope',
    description:
      'Contiene los iconos y fuentes necesarias para que Euroscope se vea correctamente.',
    source: 'font',
    assetPath: 'extras/euroscope.ttf',
    mandatory: true,
  },
  {
    id: 'vspv',
    name: 'Fuente VSPV',
    description:
      'Esta fuente será usada por el plugin SACTA para asemejarse lo máximo posible a los radares reales.',
    source: 'font',
    assetPath: 'extras/vspv.ttf',
  },
  {
    id: 'trackaudio',
    name: 'TrackAudio',
    description:
      'Cliente de audio moderno para VATSIM. Reemplaza a Audio for VATSIM con mejor calidad de audio y menor latencia.',
    version: 'Última versión estable',
    source: 'github',
    githubRepo: 'pierr3/TrackAudio',
    releaseTag: 'latest',
    assetPattern: /TrackAudio.*Setup.*\.exe$|TrackAudio.*\.exe$/i,
    installArgs: [],
  },
  {
    id: 'vatis',
    name: 'vATIS',
    description:
      'Herramienta para generar y emitir información ATIS digital en la red VATSIM.',
    version: 'Última versión',
    source: 'url',
    downloadUrl: 'https://hub.vatis.app/download/windows',
    installArgs: [],
  },
];
