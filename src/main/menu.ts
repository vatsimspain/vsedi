import {
  app,
  Menu,
  shell,
  BrowserWindow,
  MenuItemConstructorOptions,
} from 'electron';

interface DarwinMenuItemConstructorOptions extends MenuItemConstructorOptions {
  selector?: string;
  submenu?: DarwinMenuItemConstructorOptions[] | Menu;
}

export default class MenuBuilder {
  mainWindow: BrowserWindow;

  constructor(mainWindow: BrowserWindow) {
    this.mainWindow = mainWindow;
  }

  buildMenu(): Menu {
    if (
      process.env.NODE_ENV === 'development' ||
      process.env.DEBUG_PROD === 'true'
    ) {
      this.setupDevelopmentEnvironment();
    }

    const template =
      process.platform === 'darwin'
        ? this.buildDarwinTemplate()
        : this.buildDefaultTemplate();

    const menu = Menu.buildFromTemplate(template);
    Menu.setApplicationMenu(menu);

    return menu;
  }

  setupDevelopmentEnvironment(): void {
    this.mainWindow.webContents.on('context-menu', (_, props) => {
      const { x, y } = props;

      Menu.buildFromTemplate([
        {
          label: 'Inspeccionar elemento',
          click: () => {
            this.mainWindow.webContents.inspectElement(x, y);
          },
        },
      ]).popup({ window: this.mainWindow });
    });
  }

  buildDarwinTemplate(): MenuItemConstructorOptions[] {
    const subMenuAbout: DarwinMenuItemConstructorOptions = {
      label: 'Electron',
      submenu: [
        {
          label: 'Acerca de',
          selector: 'orderFrontStandardAboutPanel:',
        },
        { type: 'separator' },
        { label: 'Servicios', submenu: [] },
        { type: 'separator' },
        {
          label: 'Ocultar',
          accelerator: 'Command+H',
          selector: 'hide:',
        },
        {
          label: 'Ocultar otros',
          accelerator: 'Command+Shift+H',
          selector: 'hideOtherApplications:',
        },
        { label: 'Mostrar todo', selector: 'unhideAllApplications:' },
        { type: 'separator' },
        {
          label: 'Salir',
          accelerator: 'Command+Q',
          click: () => {
            app.quit();
          },
        },
      ],
    };
    const subMenuEdit: DarwinMenuItemConstructorOptions = {
      label: 'Editar',
      submenu: [
        { label: 'Deshacer', accelerator: 'Command+Z', selector: 'undo:' },
        { label: 'Rehacer', accelerator: 'Shift+Command+Z', selector: 'redo:' },
        { type: 'separator' },
        { label: 'Cortar', accelerator: 'Command+X', selector: 'cut:' },
        { label: 'Copiar', accelerator: 'Command+C', selector: 'copy:' },
        { label: 'Pegar', accelerator: 'Command+V', selector: 'paste:' },
        {
          label: 'Seleccionar todo',
          accelerator: 'Command+A',
          selector: 'selectAll:',
        },
      ],
    };
    const subMenuViewDev: MenuItemConstructorOptions = {
      label: 'Vista',
      submenu: [
        {
          label: 'Recargar',
          accelerator: 'Command+R',
          click: () => {
            this.mainWindow.webContents.reload();
          },
        },
        {
          label: 'Pantalla completa',
          accelerator: 'Ctrl+Command+F',
          click: () => {
            this.mainWindow.setFullScreen(!this.mainWindow.isFullScreen());
          },
        },
        // {
        //   label: 'Herramientas de desarrollador',
        //   accelerator: 'Alt+Command+I',
        //   click: () => {
        //     this.mainWindow.webContents.toggleDevTools();
        //   },
        // },
      ],
    };
    const subMenuViewProd: MenuItemConstructorOptions = {
      label: 'Vista',
      submenu: [
        {
          label: 'Pantalla completa',
          accelerator: 'Ctrl+Command+F',
          click: () => {
            this.mainWindow.setFullScreen(!this.mainWindow.isFullScreen());
          },
        },
      ],
    };
    const subMenuWindow: DarwinMenuItemConstructorOptions = {
      label: 'Ventana',
      submenu: [
        {
          label: 'Minimizar',
          accelerator: 'Command+M',
          selector: 'performMiniaturize:',
        },
        {
          label: 'Cerrar',
          accelerator: 'Command+W',
          selector: 'performClose:',
        },
        { type: 'separator' },
        { label: 'Traer todo al frente', selector: 'arrangeInFront:' },
      ],
    };
    const subMenuHelp: MenuItemConstructorOptions = {
      label: 'Ayuda',
      submenu: [
        {
          label: 'Dashboard VATSIM Spain',
          click() {
            shell.openExternal('https://dashboard.vatsimspain.es');
          },
        },
        {
          label: 'Web VATSIM Spain',
          click() {
            shell.openExternal('https://vatsimspain.es');
          },
        },
        { type: 'separator' },
        {
          label: 'Discord',
          click() {
            shell.openExternal('https://dashboard.vatsimspain.es');
          },
        },
        {
          label: 'Instagram',
          click() {
            shell.openExternal('https://www.instagram.com/vatsimspain/');
          },
        },
        {
          label: 'YouTube',
          click() {
            shell.openExternal('https://www.youtube.com/@vatsimspain');
          },
        },
        {
          label: 'X (Twitter)',
          click() {
            shell.openExternal('https://x.com/vatsimSpain');
          },
        },
        {
          label: 'TikTok',
          click() {
            shell.openExternal('https://www.tiktok.com/@vatsimspain');
          },
        },
        { type: 'separator' },
        {
          label: 'Contacto: operaciones@vatsimspain.es',
          click() {
            shell.openExternal('mailto:operaciones@vatsimspain.es');
          },
        },
      ],
    };

    const subMenuView =
      process.env.NODE_ENV === 'development' ||
      process.env.DEBUG_PROD === 'true'
        ? subMenuViewDev
        : subMenuViewProd;

    const subMenuUltraSecret: MenuItemConstructorOptions = {
      label: '🤫',
      submenu: [
        {
          label: 'Modo ULTRA Secreto',
          type: 'checkbox',
          checked: false,
          click: (menuItem) => {
            this.mainWindow.webContents.send('ultra:secret', menuItem.checked);
          },
        },
      ],
    };

    return [
      subMenuAbout,
      subMenuEdit,
      subMenuView,
      subMenuWindow,
      subMenuHelp,
      subMenuUltraSecret,
    ];
  }

  buildDefaultTemplate(): MenuItemConstructorOptions[] {
    const isDev =
      process.env.NODE_ENV === 'development' ||
      process.env.DEBUG_PROD === 'true';

    const templateDefault: MenuItemConstructorOptions[] = [
      ...(isDev
        ? [
            {
              label: '&Archivo',
              submenu: [
                {
                  label: '&Abrir',
                  accelerator: 'Ctrl+O',
                },
                {
                  label: '&Cerrar',
                  accelerator: 'Ctrl+W',
                  click: () => {
                    this.mainWindow.close();
                  },
                },
              ],
            } as MenuItemConstructorOptions,
          ]
        : []),
      {
        label: '&Vista',
        submenu: isDev
          ? [
              {
                label: '&Recargar',
                accelerator: 'Ctrl+R',
                click: () => {
                  this.mainWindow.webContents.reload();
                },
              },
              {
                label: 'Pantalla &completa',
                accelerator: 'F11',
                click: () => {
                  this.mainWindow.setFullScreen(
                    !this.mainWindow.isFullScreen(),
                  );
                },
              },
              {
                label: 'Herramientas de &desarrollador',
                accelerator: 'Alt+Ctrl+I',
                click: () => {
                  this.mainWindow.webContents.toggleDevTools();
                },
              },
            ]
          : [
              {
                label: 'Pantalla &completa',
                accelerator: 'F11',
                click: () => {
                  this.mainWindow.setFullScreen(
                    !this.mainWindow.isFullScreen(),
                  );
                },
              },
            ],
      },
      {
        label: 'Ayuda',
        submenu: [
          {
            label: 'Repositorio en GitHub',
            click() {
              shell.openExternal('https://github.com/vatsimspain/vsedi');
            },
          },
          { type: 'separator' },
          {
            label: 'Dashboard VATSIM Spain',
            click() {
              shell.openExternal('https://dashboard.vatsimspain.es');
            },
          },
          {
            label: 'Web VATSIM Spain',
            click() {
              shell.openExternal('https://vatsimspain.es');
            },
          },
          { type: 'separator' },
          {
            label: 'Discord',
            click() {
              shell.openExternal('https://dashboard.vatsimspain.es');
            },
          },
          {
            label: 'Instagram',
            click() {
              shell.openExternal('https://www.instagram.com/vatsimspain/');
            },
          },
          {
            label: 'YouTube',
            click() {
              shell.openExternal('https://www.youtube.com/@vatsimspain');
            },
          },
          {
            label: 'X (Twitter)',
            click() {
              shell.openExternal('https://x.com/vatsimSpain');
            },
          },
          {
            label: 'TikTok',
            click() {
              shell.openExternal('https://www.tiktok.com/@vatsimspain');
            },
          },
          { type: 'separator' },
          {
            label: 'Contacto: operaciones@vatsimspain.es',
            click() {
              shell.openExternal('mailto:operaciones@vatsimspain.es');
            },
          },
          { type: 'separator' },
          {
            label: '👨🏼‍🦲',
            type: 'checkbox',
            checked: false,
            click: (menuItem) => {
              this.mainWindow.webContents.send(
                'ultra:secret',
                menuItem.checked,
              );
            },
          },
        ],
      },
    ];

    return templateDefault;
  }
}
