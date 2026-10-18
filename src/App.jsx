
import { useEffect, useState } from "react";
import "./App.css";

const STORAGE_KEY = "jindeye-equipment-v1";

const equipmentTypes = ["투구", "갑옷", "허리띠", "신발"];
const equipmentLevels = [0, 20, 50, 80, 110, 150, 180];
const tiers = ["5T", "4T", "3T", "2T", "1T"];

const equipmentNames = {
  0: {
    "5T": "가죽",
    "4T": "가죽",
    "3T": "가죽",
    "2T": "가죽",
    "1T": "가죽",
  },
  20: {
    "5T": "장인",
    "4T": "장인",
    "3T": "장인",
    "2T": "장인",
    "1T": "장인",
  },

  50: {
    "5T": "동군",
    "4T": "투해",
    "3T": "광전",
    "2T": "백비",
    "1T": "광설",
  },
  80: {
    "5T": "호군",
    "4T": "백현",
    "3T": "청군",
    "2T": "장현",
    "1T": "금군",
  },
  110: {
    "5T": "진무",
    "4T": "녹귀",
    "3T": "금투",
    "2T": "금청",
    "1T": "염화",
  },
  150: {
    "5T": "괴록",
    "4T": "적령",
    "3T": "투령",
    "2T": "진군",
    "1T": "산령",
  },
  180: {
    "5T": "광룡",
    "4T": "천군",
    "3T": "청귀",
    "2T": "괴황",
    "1T": "금성",
  },
};

const emptyForm = {
  type: "투구",
  baseLevel: 50,
  tier: "5T",
  level: 0,
};

function clampLevel(value) {
  const number = Number(value);

  if (!Number.isFinite(number)) return 0;

  return Math.max(0, Math.min(20, Math.floor(number)));
}

function createEquipmentName(type, baseLevel, tier) {
  const suffix = {
    갑옷: "갑옷",
    투구: "투구",
    허리띠: "대",
    신발: "신",
  }[type] ?? "";

  // 0레벨과 20레벨은 등급이 없으므로 고정 이름을 사용합니다.
  if (Number(baseLevel) === 0) {
    return `찬란한가죽${suffix}`;
  }

  if (Number(baseLevel) === 20) {
    return `찬란한장인${suffix}`;
  }

  const name = equipmentNames[baseLevel]?.[tier] ?? "장비";
  return `찬란한${name}${suffix}`;
}

function calculateStats(item) {
  const level = clampLevel(item.level);

  switch (item.type) {
    case "투구":
      return {
        label: "경험치 획득량",
        value: (level + 1) * 0.2,
        unit: "%",
      };

    case "갑옷":
      return {
        label: "공격력",
        value: level + 1,
        unit: "",
      };

    case "허리띠":
      return {
        label: "아이템 드랍률",
        value: (level + 1) * 0.2,
        unit: "%",
      };

    case "신발":
      return {
        label: "공격력",
        value: (level + 1) * 0.3,
        unit: "%",
      };

    default:
      return {
        label: "능력치",
        value: 0,
        unit: "",
      };
  }
}

function formatStat(value) {
  return Number(value.toFixed(2)).toString();
}

function loadEquipment() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);

    if (!saved) return [];

    const parsed = JSON.parse(saved);

    if (!Array.isArray(parsed)) return [];

    return parsed.map((item) => ({
      ...item,
      level: clampLevel(item.level),
    }));
  } catch {
    return [];
  }
}

export default function App() {
  const [equipment, setEquipment] = useState(loadEquipment);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  // 그룹별 접기/펼치기 상태를 저장합니다. 기본값은 펼쳐진 상태입니다.
  const [collapsedGroups, setCollapsedGroups] = useState({});

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(equipment));
  }, [equipment]);

  const equipmentName = createEquipmentName(
    form.type,
    Number(form.baseLevel),
    form.tier
  );

  const previewStats = calculateStats({
    ...form,
    level: clampLevel(form.level),
  });

  function updateForm(field, value) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  function addEquipment(event) {
    event.preventDefault();

    const level = clampLevel(form.level);

    const item = {
      id: editingId ?? crypto.randomUUID(),
      name: equipmentName,
      type: form.type,
      baseLevel: Number(form.baseLevel),
      tier: form.tier,
      level,
    };

    if (editingId !== null) {
      setEquipment((current) =>
        current.map((existing) =>
          existing.id === editingId ? item : existing
        )
      );
    } else {
      setEquipment((current) => [item, ...current]);
    }

    setForm(emptyForm);
    setEditingId(null);
  }

  function editEquipment(item) {
    setEditingId(item.id);

    setForm({
      type: item.type,
      baseLevel: item.baseLevel == null ? 50 : Number(item.baseLevel),
      tier: item.tier || "5T",
      level: clampLevel(item.level),
    });

    document
      .getElementById("equipment-form")
      ?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function cancelEdit() {
    setEditingId(null);
    setForm(emptyForm);
  }

  function deleteEquipment(id) {
    if (!window.confirm("이 장비를 진열대에서 삭제할까요?")) {
      return;
    }

    setEquipment((current) =>
      current.filter((item) => item.id !== id)
    );

    if (editingId === id) {
      setEditingId(null);
      setForm(emptyForm);
    }
  }

  // 같은 레벨과 등급의 장비를 한 그룹으로 묶습니다.
  // 0레벨과 20레벨은 등급이 없으므로 레벨만으로 묶습니다.
  const groupedEquipment = equipment.reduce((groups, item) => {
    const baseLevel = item.baseLevel == null ? 50 : Number(item.baseLevel);
    const hasTier = baseLevel !== 0 && baseLevel !== 20;
    const tier = item.tier || "5T";
    const groupKey = hasTier ? `${baseLevel}-${tier}` : `${baseLevel}`;

    if (!groups[groupKey]) {
      groups[groupKey] = {
        baseLevel,
        tier: hasTier ? tier : null,
        items: [],
      };
    }

    groups[groupKey].items.push(item);
    return groups;
  }, {});

  const sortedGroups = Object.values(groupedEquipment).sort((a, b) => {
    if (a.baseLevel !== b.baseLevel) return a.baseLevel - b.baseLevel;
    const tierOrder = tiers.indexOf(a.tier) - tiers.indexOf(b.tier);
    return tierOrder;
  });

  return (
    <main className="app">
      <header className="topbar">
        <div className="brand">진열대</div>
        <span className="topbar-badge">개인 진열대 미리보기</span>
      </header>

      <div className="workspace">
        <section
          className="panel form-panel"
          id="equipment-form"
        >
          <div className="panel-heading">
            <h2>
              {editingId !== null
                ? "장비 수정하기"
                : "장비 등록하기"}
            </h2>

            <button
              type="submit"
              form="equipment-registration-form"
              className="add-button"
              aria-label={
                editingId !== null ? "장비 수정 완료" : "장비 등록"
              }
            >
              {editingId !== null ? "✓" : "＋"}
            </button>
          </div>

          <form
            id="equipment-registration-form"
            onSubmit={addEquipment}
          >
            <div className="form-group">
              <label htmlFor="equipment-type">장비 종류</label>
              <select
                id="equipment-type"
                value={form.type}
                onChange={(event) =>
                  updateForm("type", event.target.value)
                }
              >
                {equipmentTypes.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="equipment-base-level">장비 레벨</label>
                <select
                  id="equipment-base-level"
                  value={form.baseLevel}
                  onChange={(event) =>
                    updateForm(
                      "baseLevel",
                      Number(event.target.value)
                    )
                  }
                >
                  {equipmentLevels.map((level) => (
                    <option key={level} value={level}>
                      {level}레벨
                    </option>
                  ))}
                </select>
              </div>

              {Number(form.baseLevel) !== 0 &&
                Number(form.baseLevel) !== 20 && (
                  <div className="form-group">
                    <label htmlFor="equipment-tier">등급</label>
                    <select
                      id="equipment-tier"
                      value={form.tier}
                      onChange={(event) =>
                        updateForm("tier", event.target.value)
                      }
                    >
                      {tiers.map((tier) => (
                        <option key={tier} value={tier}>
                          {tier.replace("T", "티어")}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
            </div>

            <div className="form-group">
              <label>장비 이름</label>
              <div className="name-preview">{equipmentName}</div>
            </div>

            <div className="form-group">
              <label htmlFor="equipment-enhancement">
                강화 단계 (+)
              </label>

              <input
                id="equipment-enhancement"
                type="number"
                min="0"
                max="20"
                step="1"
                value={form.level}
                onChange={(event) => {
                  const value = event.target.value;

                  if (value === "") {
                    updateForm("level", "");
                    return;
                  }

                  updateForm("level", clampLevel(value));
                }}
                onBlur={() => {
                  updateForm("level", clampLevel(form.level));
                }}
                required
              />

              <small className="help-text">
                0강부터 20강까지 등록할 수 있습니다.
              </small>
            </div>

            <div className="preview-box">
              <span className="preview-label">강화 능력치</span>
              <strong>
                {previewStats.label}{" "}
                +{formatStat(previewStats.value)}
                {previewStats.unit}
              </strong>
            </div>

            {editingId !== null && (
              <button
                type="button"
                className="cancel-button"
                onClick={cancelEdit}
              >
                수정 취소
              </button>
            )}
          </form>
        </section>

        <section className="panel display-panel">
          <div className="panel-heading">
            <h2>
              나의 진열대{" "}
              <span className="equipment-count">
                {equipment.length}
              </span>
            </h2>
          </div>

          {equipment.length === 0 ? (
            <div className="empty-state">
              <p>아직 등록된 장비가 없습니다.</p>
              <span>왼쪽에서 장비를 등록해 보세요.</span>
            </div>
          ) : (
            <div className="equipment-groups">
              {sortedGroups.map((group) => (
                <section
                  className="equipment-group"
                  key={`${group.baseLevel}-${group.tier || "no-tier"}`}
                >
                  <button
                    type="button"
                    className="equipment-group-title"
                    aria-expanded={
                      !collapsedGroups[`${group.baseLevel}-${group.tier || "no-tier"}`]
                    }
                    onClick={() => {
                      const key = `${group.baseLevel}-${group.tier || "no-tier"}`;
                      setCollapsedGroups((current) => ({
                        ...current,
                        [key]: !current[key],
                      }));
                    }}
                  >
                    <span className="equipment-group-name">
                      {group.baseLevel}레벨
                      {group.tier && ` · ${group.tier.replace("T", "티어")}`}
                    </span>
                    <span className="equipment-count">
                      {group.items.length}
                    </span>
                    <span className="equipment-group-toggle">
                      {collapsedGroups[`${group.baseLevel}-${group.tier || "no-tier"}`]
                        ? "펼치기 ＋"
                        : "접기 −"}
                    </span>
                  </button>

                  {!collapsedGroups[`${group.baseLevel}-${group.tier || "no-tier"}`] && (
                    <div className="equipment-grid">
                      {group.items.map((item) => {
                      const stats = calculateStats(item);
                      const name = createEquipmentName(
                        item.type,
                        item.baseLevel == null ? 50 : Number(item.baseLevel),
                        item.tier || "5T"
                      );

                      return (
                        <article
                          className="equipment-card"
                          key={item.id}
                        >
                          <div className="equipment-card-top">
                            <span className="equipment-type">
                              {item.type}
                            </span>

                            <div className="equipment-actions">
                              <button
                                type="button"
                                className="edit-button"
                                onClick={() => editEquipment(item)}
                                aria-label={`${name} 수정`}
                              >
                                수정
                              </button>

                              <button
                                type="button"
                                className="delete-button"
                                onClick={() => deleteEquipment(item.id)}
                                aria-label={`${name} 삭제`}
                              >
                                X
                              </button>
                            </div>
                          </div>

                          <h3 className="equipment-name">{name}</h3>

                          <p className="equipment-level">
                            {item.baseLevel ?? "-"}레벨
                            {Number(item.baseLevel) !== 0 &&
                              Number(item.baseLevel) !== 20 && (
                                <> · {(item.tier || "5T").replace("T", "티어")}</>
                              )}
                          </p>

                          <div className="enhancement-level">
                            +{clampLevel(item.level)}강
                          </div>

                          <div className="equipment-stat">
                            <span>{stats.label}</span>
                            <strong>
                              +{formatStat(stats.value)}
                              {stats.unit}
                            </strong>
                          </div>
                        </article>
                      );
                      })}
                    </div>
                  )}
                </section>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
