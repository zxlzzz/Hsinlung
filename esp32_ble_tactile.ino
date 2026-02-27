/*
 * 灵触·随行 — ESP32-S3 固件
 *
 * 105pin扁平grid：
 *   [0-35]   前方盲文 F1-F6 (每个6pin, 二值)
 *   [36-53]  左侧盲文 L1-L3
 *   [54-71]  右侧盲文 R1-R3
 *   [72-89]  后方盲文 B1-B3
 *   [90-104] DIY核心区 3×5 (三档)
 *
 * 接线和之前测三档PWM一样：
 *   ESP32 GPIO1(SDA) → PCA9685 SDA
 *   ESP32 GPIO2(SCL) → PCA9685 SCL
 *
 * Arduino IDE: 安装 Adafruit PWM Servo Driver Library, 板子选 ESP32S3 Dev Module
 */

#include <Wire.h>
#include <Adafruit_PWMServoDriver.h>
#include <BLEDevice.h>
#include <BLEServer.h>
#include <BLEUtils.h>
#include <BLE2902.h>

// ═══════════ CONFIG ═══════════
// 和 constants.js 保持一致

#define PINS_PER_MODULE   6
#define FRONT_MODULES     6
#define LEFT_MODULES      3
#define RIGHT_MODULES     3
#define BACK_MODULES      3
#define TOTAL_MODULES     15

#define DIY_COLS          3
#define DIY_ROWS          5
#define DIY_PINS          15

#define BRAILLE_PINS      (TOTAL_MODULES * PINS_PER_MODULE)  // 90
#define GRID_SIZE         (BRAILLE_PINS + DIY_PINS)           // 105
#define DIY_START         BRAILLE_PINS                         // 90

// PWM (PCA9685: 0-4095)
#define PWM_OFF       0
#define PWM_MID       2048
#define PWM_HIGH      4095

// I2C
#define SDA_PIN       1
#define SCL_PIN       2

// ═══════════ 自动计算 ═══════════

#define GRID_BYTES    ((GRID_SIZE + 3) / 4)    // 27
#define FULL_FRAME_LEN (4 + GRID_BYTES + 1)    // 32

// BLE UUID
#define SERVICE_UUID        "0000FFE0-0000-1000-8000-00805F9B34FB"
#define CHAR_TACTILE_UUID   "0000FFE1-0000-1000-8000-00805F9B34FB"
#define CHAR_MODE_UUID      "0000FFE2-0000-1000-8000-00805F9B34FB"
#define CHAR_STATUS_UUID    "0000FFE3-0000-1000-8000-00805F9B34FB"

#define FRAME_FULL    0x01
#define FRAME_DIFF    0x02
#define CMD_MODE      0x10

// ═══════════ 全局变量 ═══════════

uint8_t grid[GRID_SIZE] = {0};
const uint16_t pwmLookup[3] = { PWM_OFF, PWM_MID, PWM_HIGH };

Adafruit_PWMServoDriver pwm0 = Adafruit_PWMServoDriver(0x40);

BLEServer* pServer = NULL;
BLECharacteristic* pTactileChar = NULL;
BLECharacteristic* pModeChar = NULL;
BLECharacteristic* pStatusChar = NULL;
bool deviceConnected = false;
bool oldDeviceConnected = false;

uint32_t frameCount = 0;
uint32_t lastStatusTime = 0;
uint8_t lastSeq = 0;
uint8_t currentMode = 0;

// ═══════════ 辅助函数 ═══════════

bool isDiyPin(int index) {
  return index >= DIY_START && index < GRID_SIZE;
}

bool checkXOR(const uint8_t* data, int from, int to, uint8_t expected) {
  uint8_t x = 0;
  for (int i = from; i <= to; i++) x ^= data[i];
  return x == expected;
}

uint8_t unpackCell(const uint8_t* packed, int index) {
  return (packed[index / 4] >> ((3 - (index % 4)) * 2)) & 0x03;
}

// ═══════════ 帧解析 ═══════════

bool parseFullFrame(const uint8_t* data, int len) {
  if (len < FULL_FRAME_LEN) {
    Serial.printf("[ERR] 全量帧太短: %d < %d\n", len, FULL_FRAME_LEN);
    return false;
  }
  if (!checkXOR(data, 4, 4 + GRID_BYTES - 1, data[FULL_FRAME_LEN - 1])) {
    Serial.println("[ERR] 全量帧校验失败");
    return false;
  }

  lastSeq = data[1];
  currentMode = data[2];

  const uint8_t* packed = &data[4];
  for (int i = 0; i < GRID_SIZE; i++) {
    uint8_t val = unpackCell(packed, i);
    if (!isDiyPin(i) && val > 1) val = 1;  // 盲文区限制二值
    grid[i] = val;
  }

  frameCount++;
  Serial.printf("[OK] 全量帧 #%d\n", lastSeq);
  return true;
}

bool parseDiffFrame(const uint8_t* data, int len) {
  if (len < 5) return false;
  int count = (data[2] << 8) | data[3];
  int expected = 4 + count * 3 + 1;
  if (len < expected) return false;
  if (count > 0 && !checkXOR(data, 4, 4 + count * 3 - 1, data[expected - 1])) {
    Serial.println("[ERR] 差分帧校验失败");
    return false;
  }

  lastSeq = data[1];
  for (int i = 0; i < count; i++) {
    int off = 4 + i * 3;
    int idx = (data[off] << 8) | data[off + 1];
    uint8_t val = data[off + 2];
    if (idx < GRID_SIZE && val <= 2) {
      if (!isDiyPin(idx) && val > 1) val = 1;
      grid[idx] = val;
    }
  }

  frameCount++;
  Serial.printf("[OK] 差分帧 #%d, %d变化\n", lastSeq, count);
  return true;
}

bool parseModeCmd(const uint8_t* data, int len) {
  if (len < 4) return false;
  if (!checkXOR(data, 0, 2, data[3])) return false;
  currentMode = data[1];
  Serial.printf("[OK] 模式: %s\n", currentMode == 0 ? "MAP" : "ZOOM");
  return true;
}

// ═══════════ PWM驱动 ═══════════

/*
 * !! 硬件到了以后改这个函数 !!
 * 
 * 需要定义：grid[i] → 哪块PCA9685的哪个通道
 * 
 * 目前：只有1块PCA9685=16通道
 *   通道0-14  → DIY区 grid[90]-grid[104]（15个DIY pin）
 *   通道15    → 空
 *   盲文模组由SPI控制，不走PCA9685（以后另加代码）
 */
void updatePWM() {
  // DIY区 → PCA9685通道0-14
  for (int i = 0; i < DIY_PINS && i < 16; i++) {
    uint8_t level = grid[DIY_START + i];
    pwm0.setPWM(i, 0, pwmLookup[level]);
  }

  // TODO: 盲文模组通过SPI控制，硬件到了再加
}

// ═══════════ BLE回调 ═══════════

class ServerCB : public BLEServerCallbacks {
  void onConnect(BLEServer* s)    { deviceConnected = true;  Serial.println("[BLE] 已连接"); }
  void onDisconnect(BLEServer* s) { deviceConnected = false; Serial.println("[BLE] 已断开"); }
};

class TactileCB : public BLECharacteristicCallbacks {
  void onWrite(BLECharacteristic* c) {
    String rx = c->getValue();
    const uint8_t* d = (const uint8_t*)rx.c_str();
    int len = rx.length();
    if (len < 1) return;
    bool ok = false;
    if (d[0] == FRAME_FULL) ok = parseFullFrame(d, len);
    else if (d[0] == FRAME_DIFF) ok = parseDiffFrame(d, len);
    if (ok) updatePWM();
  }
};

class ModeCB : public BLECharacteristicCallbacks {
  void onWrite(BLECharacteristic* c) {
    String rx = c->getValue();
    const uint8_t* d = (const uint8_t*)rx.c_str();
    if (rx.length() >= 4 && d[0] == CMD_MODE) parseModeCmd(d, rx.length());
  }
};

// ═══════════ 状态上报 ═══════════

void sendStatus() {
  if (!deviceConnected || !pStatusChar) return;
  uint8_t s[5] = { 0x20, 100, 0x00, lastSeq, 0 };
  s[4] = s[0] ^ s[1] ^ s[2] ^ s[3];
  pStatusChar->setValue(s, 5);
  pStatusChar->notify();
}

// ═══════════ 串口调试 ═══════════

void printGrid() {
  Serial.println("--- 盲文区 [0-89] ---");
  const char* zones[] = { "F", "F", "F", "F", "F", "F", "L", "L", "L", "R", "R", "R", "B", "B", "B" };
  for (int m = 0; m < TOTAL_MODULES; m++) {
    Serial.printf("%s%d: ", zones[m], (m % 6) + 1);
    for (int p = 0; p < PINS_PER_MODULE; p++) {
      Serial.print(grid[m * PINS_PER_MODULE + p]);
    }
    Serial.println();
  }
  Serial.println("--- DIY区 [90-104] ---");
  for (int r = 0; r < DIY_ROWS; r++) {
    for (int c = 0; c < DIY_COLS; c++) {
      Serial.print(grid[DIY_START + r * DIY_COLS + c]);
    }
    Serial.println();
  }
  Serial.printf("帧数:%d 模式:%s\n", frameCount, currentMode == 0 ? "MAP" : "ZOOM");
}

// ═══════════ 初始化 ═══════════

void setup() {
  Serial.begin(115200);
  delay(500);

  Serial.println("=== 灵触·随行 ===");
  Serial.printf("盲文: %d模组 × %dpin = %dpin\n", TOTAL_MODULES, PINS_PER_MODULE, BRAILLE_PINS);
  Serial.printf("DIY: %d×%d = %dpin (三档)\n", DIY_COLS, DIY_ROWS, DIY_PINS);
  Serial.printf("总计: %dpin\n", GRID_SIZE);

  Wire.begin(SDA_PIN, SCL_PIN);
  pwm0.begin();
  pwm0.setPWMFreq(1000);
  for (int i = 0; i < 16; i++) pwm0.setPWM(i, 0, 0);
  Serial.println("[PWM] PCA9685 就绪");

  BLEDevice::init("LingChu-Tactile");
  BLEDevice::setMTU(247);
  pServer = BLEDevice::createServer();
  pServer->setCallbacks(new ServerCB());

  BLEService* svc = pServer->createService(SERVICE_UUID);
  pTactileChar = svc->createCharacteristic(CHAR_TACTILE_UUID, BLECharacteristic::PROPERTY_WRITE);
  pTactileChar->setCallbacks(new TactileCB());
  pModeChar = svc->createCharacteristic(CHAR_MODE_UUID, BLECharacteristic::PROPERTY_WRITE);
  pModeChar->setCallbacks(new ModeCB());
  pStatusChar = svc->createCharacteristic(CHAR_STATUS_UUID, BLECharacteristic::PROPERTY_NOTIFY);
  pStatusChar->addDescriptor(new BLE2902());

  svc->start();
  BLEDevice::getAdvertising()->addServiceUUID(SERVICE_UUID);
  BLEDevice::getAdvertising()->setScanResponse(true);
  BLEDevice::startAdvertising();

  Serial.println("[BLE] 广播中: LingChu-Tactile");
  Serial.println("命令: test / clear / print / status");
}

// ═══════════ 主循环 ═══════════

void loop() {
  if (deviceConnected && (millis() - lastStatusTime >= 5000)) {
    sendStatus();
    lastStatusTime = millis();
  }
  if (!deviceConnected && oldDeviceConnected) {
    delay(500);
    pServer->startAdvertising();
    oldDeviceConnected = false;
  }
  if (deviceConnected && !oldDeviceConnected) oldDeviceConnected = true;

  if (Serial.available()) {
    String cmd = Serial.readStringUntil('\n');
    cmd.trim();
    if (cmd == "print" || cmd == "p") {
      printGrid();
    } else if (cmd == "test") {
      // 盲文区全1，DIY区全2
      for (int i = 0; i < BRAILLE_PINS; i++) grid[i] = 1;
      for (int i = DIY_START; i < GRID_SIZE; i++) grid[i] = 2;
      updatePWM();
      printGrid();
    } else if (cmd == "clear") {
      memset(grid, 0, GRID_SIZE);
      updatePWM();
      Serial.println("已清空");
    } else if (cmd == "status") {
      Serial.printf("BLE:%s 帧数:%d 模式:%s\n",
        deviceConnected ? "已连" : "未连", frameCount,
        currentMode == 0 ? "MAP" : "ZOOM");
    }
  }
  delay(10);
}
