// Встроенная команда Siri (App Intent + App Shortcuts) без ручной настройки «Команд»:
// «Привет, Siri, запиши в <название>» → Siri спрашивает «Что съел или как тренировался?» →
// приложение открывается на levelup://log?text=…, которое пишет фразу сразу.
// Фразы в коде на русском, поэтому язык разработки проекта ставится «ru».
const fs = require('fs');
const path = require('path');
const { IOSConfig, withDangerousMod, withInfoPlist, withXcodeProject } = require('expo/config-plugins');

const FILE = 'LogEntryIntent.swift';

const SWIFT = `import AppIntents
import UIKit

@available(iOS 16.0, *)
struct LogEntryIntent: AppIntent {
  static let title: LocalizedStringResource = "Записать еду или тренировку"
  static let description = IntentDescription("Скажи, что съел или как тренировался, — запись появится в приложении.")
  static let openAppWhenRun: Bool = true

  @Parameter(title: "Что записать", requestValueDialog: IntentDialog("Что съел или как тренировался?"))
  var text: String

  @MainActor
  func perform() async throws -> some IntentResult {
    var components = URLComponents()
    components.scheme = "levelup"
    components.host = "log"
    components.queryItems = [URLQueryItem(name: "text", value: text)]
    // При холодном запуске JS ещё грузится — даём ему время подписаться на ссылки.
    if UIApplication.shared.applicationState != .active {
      try? await Task.sleep(nanoseconds: 1_500_000_000)
    } else {
      try? await Task.sleep(nanoseconds: 300_000_000)
    }
    if let url = components.url {
      await UIApplication.shared.open(url)
    }
    return .result()
  }
}

@available(iOS 16.0, *)
struct LevelUpShortcuts: AppShortcutsProvider {
  static var appShortcuts: [AppShortcut] {
    AppShortcut(
      intent: LogEntryIntent(),
      phrases: [
        "Запиши в \\(.applicationName)",
        "Записать в \\(.applicationName)",
        "Добавь в \\(.applicationName)",
        "\\(.applicationName) запиши"
      ],
      shortTitle: "Записать",
      systemImageName: "mic.fill"
    )
  }
}
`;

module.exports = function withSiriShortcut(config, { altNames = [] } = {}) {
  config = withInfoPlist(config, (c) => {
    c.modResults.CFBundleDevelopmentRegion = 'ru';
    // Как ещё Siri может услышать название (например, «Level Up» по-русски).
    if (altNames.length) c.modResults.INAlternativeAppNames = altNames.map((n) => ({ INAlternativeAppName: n }));
    return c;
  });

  config = withDangerousMod(config, [
    'ios',
    async (c) => {
      const dir = path.join(c.modRequest.platformProjectRoot, c.modRequest.projectName);
      fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(path.join(dir, FILE), SWIFT);
      return c;
    },
  ]);

  config = withXcodeProject(config, (c) => {
    const project = c.modResults;
    const name = c.modRequest.projectName;
    const filepath = `${name}/${FILE}`;
    if (!project.hasFile(filepath)) {
      IOSConfig.XcodeUtils.addBuildSourceFileToGroup({ filepath, groupName: name, project });
    }
    const root = project.getFirstProject().firstProject;
    root.developmentRegion = 'ru';
    root.knownRegions = Array.from(new Set([...(root.knownRegions ?? []), 'ru']));
    return c;
  });

  return config;
};
