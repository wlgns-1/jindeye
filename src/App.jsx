
import { useEffect, useState } from "react";
import "./App.css";

const STORAGE_KEY = "jindeye-equipment-v1";

const equipmentTypes = ["투구", "갑옷", "허리띠", "신발"];

function getEquipmentImageUrl(type, tier) {
  const tierNumber = String(tier || "5T").replace("T", "");
  const folders = { "투구": "helmets", "갑옷": "armor", "허리띠": "belts", "신발": "boots" };
  const fileNames = { "투구": `helmet_tier${tierNumber}.png`, "갑옷": `armor_tier${tierNumber}.png`, "허리띠": `belts_tier${tierNumber}.png`, "신발": `boots_tier${tierNumber}.png` };
  return `/images/${folders[type] || "helmets"}/${fileNames[type] || fileNames["투구"]}`;
}
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

    // 레벨 0/20 그룹은 티어와 관계없이 하나의 그룹으로 취급합니다.
    const targetBaseLevel = Number(form.baseLevel);
    const targetTier = targetBaseLevel === 0 || targetBaseLevel === 20
      ? null
      : (form.tier || "5T");

    // 같은 그룹에는 장비 종류별로 하나만 등록할 수 있습니다.
    const duplicate = equipment.some((existing) => {
      if (existing.id === editingId) return false;
      const existingBaseLevel = Number(existing.baseLevel ?? 50);
      const existingTier = existingBaseLevel === 0 || existingBaseLevel === 20
        ? null
        : (existing.tier || "5T");
      return existingBaseLevel === targetBaseLevel &&
        existingTier === targetTier &&
        existing.type === form.type;
    });
    if (duplicate) {
      window.alert(`${form.type}은(는) 이 그룹에 이미 등록되어 있습니다. 기존 장비를 수정하거나 삭제해 주세요.`);
      return false;
    }

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
    return true;
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

  const [selectedGroupKey, setSelectedGroupKey] = useState(null);
  const [selectedEquipmentId, setSelectedEquipmentId] = useState(null);
  const [showRegistrationForm, setShowRegistrationForm] = useState(false);

  const allGroups = equipmentLevels.flatMap((baseLevel) => {
    const groupTiers = baseLevel === 0 || baseLevel === 20 ? [null] : tiers;
    return groupTiers.map((tier) => {
      const key = tier ? `${baseLevel}-${tier}` : `${baseLevel}`;
      const name = baseLevel === 0
        ? "찬란한가죽"
        : baseLevel === 20
          ? "찬란한장인"
          : `찬란한${equipmentNames[baseLevel]?.[tier] ?? "장비"}`;
      return {
        key,
        baseLevel,
        tier,
        name,
        items: sortedGroups.find((group) =>
          group.baseLevel === baseLevel && (group.tier || null) === tier
        )?.items ?? [],
      };
    });
  });

  const selectedGroup = allGroups.find((group) => group.key === selectedGroupKey);
  const selectedEquipment = selectedGroup?.items.find((item) => item.id === selectedEquipmentId)
    ?? selectedGroup?.items[0]
    ?? null;
  const selectedStats = selectedEquipment ? calculateStats(selectedEquipment) : null;

  function openGroup(group) {
    setSelectedGroupKey(group.key);
    setSelectedEquipmentId(group.items[0]?.id ?? null);
    setShowRegistrationForm(false);
    setEditingId(null);
    setForm({
      ...emptyForm,
      baseLevel: group.baseLevel,
      tier: group.tier || "5T",
    });
  }

  const availableEquipmentTypes = selectedGroup
    ? equipmentTypes.filter((type) => !selectedGroup.items.some((item) => item.type === type))
    : equipmentTypes;

  function startAddingEquipment() {
    if (!selectedGroup) return;
    if (availableEquipmentTypes.length === 0) {
      window.alert("이 그룹에는 투구, 갑옷, 허리띠, 신발이 모두 등록되어 있습니다.");
      return;
    }
    setEditingId(null);
    setForm({
      ...emptyForm,
      type: availableEquipmentTypes[0],
      baseLevel: selectedGroup.baseLevel,
      tier: selectedGroup.tier || "5T",
    });
    setShowRegistrationForm(true);
  }

  function startEditingEquipment(item) {
    editEquipment(item);
    setShowRegistrationForm(true);
  }

  return (
    <main className="app">
      <header className="topbar">
        <button
          type="button"
          className="brand brand-button"
          onClick={() => {
            setSelectedGroupKey(null);
            setSelectedEquipmentId(null);
            setShowRegistrationForm(false);
          }}
        >
          진열대
        </button>
        <span className="topbar-badge">장비 도감</span>
      </header>

      {!selectedGroup ? (
        <section className="panel group-select-panel">
          <div className="panel-heading">
            <h2>진열대 선택</h2>
            <span className="equipment-count">{allGroups.length}</span>
          </div>
          <p className="screen-description">확인할 장비 그룹을 선택하세요.</p>
          <div className="group-select-grid">
            {allGroups.map((group) => (
              <button
                type="button"
                className="group-select-card"
                key={group.key}
                onClick={() => openGroup(group)}
              >
                <span className="group-select-name">{group.name} 장비</span>
                <span className="group-select-meta">
                  {group.baseLevel}레벨{group.tier ? ` · ${group.tier.replace("T", "티어")}` : ""}
                </span>
                <span className="group-select-action">선택 →</span>
              </button>
            ))}
          </div>
        </section>
      ) : (
        <div className="detail-layout">
          <section className="panel detail-main-panel">
            <div className="panel-heading">
              <div>
                <button
                  type="button"
                  className="back-button"
                  onClick={() => {
                    setSelectedGroupKey(null);
                    setSelectedEquipmentId(null);
                    setShowRegistrationForm(false);
                  }}
                >
                  ← 진열대 선택
                </button>
                <h2>{selectedGroup.name} 장비</h2>
              </div>
              <button type="button" className="add-button add-equipment-button" onClick={startAddingEquipment} disabled={availableEquipmentTypes.length === 0}>
                ＋ 장비 등록
              </button>
            </div>

            <div className="equipment-type-tabs">
              {equipmentTypes.map((type) => {
                const item = selectedGroup.items.find((entry) => entry.type === type);
                return (
                  <button
                    type="button"
                    key={type}
                    className={`equipment-type-tab ${selectedEquipment?.id === item?.id && item ? "active" : ""}`}
                    onClick={() => item && setSelectedEquipmentId(item.id)}
                    disabled={!item}
                  >
                    <span className="type-tab-topline">
                      <img className="type-tab-image" src={getEquipmentImageUrl(type, selectedGroup.tier)} alt={`${type} 마인크래프트 아이콘`} loading="lazy" />
                      <span className="type-tab-name">{item ? `${selectedGroup.name}${type}` : type}</span>
                    </span>
                    {item ? (
                      <>
                        <strong>+{clampLevel(item.level)}강</strong>
                        <small>{calculateStats(item).label} +{formatStat(calculateStats(item).value)}{calculateStats(item).unit}</small>
                      </>
                    ) : (
                      <small>미등록</small>
                    )}
                  </button>
                );
              })}
            </div>

            {selectedEquipment ? (
              <div className="selected-equipment-card">
                <div className="selected-equipment-heading">
                  <div className="selected-equipment-visual">
                    <div className="selected-equipment-image-wrap">
                      <img className="selected-equipment-image" src={getEquipmentImageUrl(selectedEquipment.type, selectedGroup.tier)} alt={`${selectedEquipment.type} 마인크래프트 장비`} />
                    </div>
                    <div className="selected-equipment-name">
                      <h3>{`${selectedGroup.name}${selectedEquipment.type}`}</h3>
                      <p>{selectedGroup.baseLevel}레벨{selectedGroup.tier ? ` · ${selectedGroup.tier.replace("T", "티어")}` : ""}</p>
                    </div>
                  </div>
                  <strong className="enhancement-level">+{clampLevel(selectedEquipment.level)}강</strong>
                </div>
                <div className="equipment-actions detail-actions">
                  <button type="button" className="edit-button" onClick={() => startEditingEquipment(selectedEquipment)}>수정</button>
                  <button type="button" className="delete-button" onClick={() => {
                    deleteEquipment(selectedEquipment.id);
                    setSelectedEquipmentId(null);
                  }}>삭제</button>
                </div>
              </div>
            ) : (
              <div className="empty-state">
                <p>이 그룹에 등록된 장비가 없습니다.</p>
                <span>장비 등록 버튼을 눌러 추가해 보세요.</span>
              </div>
            )}

            {showRegistrationForm && (
              <section className="panel form-panel registration-panel" id="equipment-form">
                <div className="panel-heading">
                  <h2>{editingId !== null ? "장비 수정하기" : "장비 등록하기"}</h2>
                  <button type="button" className="cancel-button" onClick={() => {
                    cancelEdit();
                    setShowRegistrationForm(false);
                  }}>닫기</button>
                </div>
                <form id="equipment-registration-form" onSubmit={(event) => {
                  const saved = addEquipment(event);
                  if (saved) setShowRegistrationForm(false);
                }}>
                  <div className="form-group">
                    <label htmlFor="equipment-type">장비 종류</label>
                    <select id="equipment-type" value={form.type} onChange={(event) => updateForm("type", event.target.value)}>
                      {(editingId !== null ? equipmentTypes : availableEquipmentTypes).map((type) => <option key={type} value={type}>{type}</option>)}
                    </select>
                    {editingId === null && <small className="field-help">이미 등록된 장비 종류는 선택 목록에 표시되지 않습니다.</small>}
                  </div>
                  {editingId !== null && (
                    <div className="form-row">
                      <div className="form-group">
                        <label htmlFor="equipment-base-level">장비 레벨</label>
                        <select id="equipment-base-level" value={form.baseLevel} onChange={(event) => {
                          const value = Number(event.target.value);
                          updateForm("baseLevel", value);
                          if (value === 0 || value === 20) updateForm("tier", "5T");
                        }}>
                          {equipmentLevels.map((level) => <option key={level} value={level}>{level}레벨</option>)}
                        </select>
                      </div>
                      {Number(form.baseLevel) !== 0 && Number(form.baseLevel) !== 20 && (
                        <div className="form-group">
                          <label htmlFor="equipment-tier">등급</label>
                          <select id="equipment-tier" value={form.tier} onChange={(event) => updateForm("tier", event.target.value)}>
                            {tiers.map((tier) => <option key={tier} value={tier}>{tier.replace("T", "티어")}</option>)}
                          </select>
                        </div>
                      )}
                    </div>
                  )}
                  <div className="form-group">
                    <label>장비 이름</label>
                    <div className="name-preview">{equipmentName}</div>
                  </div>
                  <div className="form-group">
                    <label htmlFor="equipment-enhancement">강화 단계 (+)</label>
                    <input
                      id="equipment-enhancement"
                      type="number"
                      min="0"
                      max="20"
                      step="1"
                      value={form.level}
                      onChange={(event) => updateForm("level", event.target.value === "" ? "" : clampLevel(event.target.value))}
                      onBlur={() => updateForm("level", clampLevel(form.level))}
                      required
                    />
                    <small className="help-text">0강부터 20강까지 등록할 수 있습니다.</small>
                  </div>
                  <div className="preview-box">
                    <span className="preview-label">강화 능력치 미리보기</span>
                    <strong>{previewStats.label} +{formatStat(previewStats.value)}{previewStats.unit}</strong>
                  </div>
                  <button type="submit" className="add-button form-submit-button">
                    {editingId !== null ? "수정 완료" : "장비 등록"}
                  </button>
                </form>
              </section>
            )}
          </section>

          <aside className="panel side-summary-panel">
            <div className="panel-heading"><h2>장비 효과</h2></div>
            {selectedGroup.items.length === 0 ? (
              <p className="empty-effect-text">등록된 장비가 없습니다.</p>
            ) : (
              <div className="side-effect-list">
                {selectedGroup.items.map((item) => {
                  const stats = calculateStats(item);
                  return (
                    <button
                      type="button"
                      key={item.id}
                      className={`side-effect-item ${selectedEquipment?.id === item.id ? "active" : ""}`}
                      onClick={() => setSelectedEquipmentId(item.id)}
                    >
                      <span className="side-effect-title">{item.type} +{clampLevel(item.level)}</span>
                      <strong>{stats.label} +{formatStat(stats.value)}{stats.unit}</strong>
                    </button>
                  );
                })}
                <div className="side-set-effect">
                  <h3>{selectedGroup.name} 세트 효과</h3>
                  <p>세트 효과 규칙 설정 후 표시됩니다.</p>
                </div>
              </div>
            )}
          </aside>
        </div>
      )}
    </main>
  );
}
