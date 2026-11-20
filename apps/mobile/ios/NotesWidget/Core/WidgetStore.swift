import Foundation
import MMKV

enum WidgetStore {
  static let groupIdentifier = "group.org.streetwriters.notesnook"
  static let instanceID = "widgets"

  private static let storage: MMKV? = {
    guard
      let container = FileManager.default
        .containerURL(forSecurityApplicationGroupIdentifier: groupIdentifier)
    else { return nil }
    let groupDir = container.appendingPathComponent("mmkv").path
    MMKV.initialize(rootDir: nil, groupDir: groupDir, logLevel: .none)
    return MMKV(mmapID: instanceID, mode: .multiProcess)
  }()

  static func readString(forKey key: String) -> String? {
    storage?.string(forKey: key)
  }

  static func decode<T: Decodable>(_ type: T.Type, forKey key: String) -> T? {
    guard let data = readString(forKey: key)?.data(using: .utf8) else { return nil }
    return try? JSONDecoder().decode(type, from: data)
  }

  static func encode<T: Encodable>(_ value: T, forKey key: String) {
    guard
      let data = try? JSONEncoder().encode(value),
      let json = String(data: data, encoding: .utf8)
    else { return }
    storage?.set(json, forKey: key)
  }
}
