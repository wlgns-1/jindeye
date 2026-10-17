
import { useEffect, useState } from "react";
import "./App.css";

const STORAGE_KEY = "jindeye-equipment-v1";

const emptyForm = {
  name: "",
  type: "투구",
  level: 0,
};

const equipmentTypes = ["투구", "갑옷", "허리띠", "신발"];

// 투구 경험치와 허리띠 드랍률
// +10 = 2.2%, +12 = 2.6%, +15 = 3.2%
function calculatePercentBonus(level) {
  const lv = Math.max(0, Number(level) || 0);
  return (lv + 1) * 0.2;
}

// 장비 종류별 능력치 계산
function calculateStats(item) {
  const level = Math.max(0, Number(item.level) || 0);

  switch (item.type) {
    case "투구":
      return {
        label: "경험치 획득량",
        value: calculatePercentBonus(level),
        unit: "%",
        icon: "✨",
      };

    case "갑옷":
      return {
        label: "공격력",
        value: level + 1,
        unit: "",
        icon: "⚔️",
      };

    case "허리띠":
      return {
        label: "드랍률",
        value: calculatePercentBonus(level),
        unit: "%",
        icon: "🍀",
      };

    case "신발":
      return {
        label: "공격력",
    value: (level + 1) * 0.3,
        unit: "%",
        icon: "👢",
      };

    default:
      return {
        label: "능력치",
        value: 0,
        unit: "",
        icon: "✨",
      };
  }
}

function formatStat(value, unit) {
  return unit === "%" ? value.toFixed(1) : String(value);
}

function loadEquipment() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    const parsed = saved ? JSON.parse(saved) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function App() {
  const [equipment, setEquipment] = useState(loadEquipment);
  const [form, setForm] = useState(emptyForm);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(equipment));
  }, [equipment]);

  const updateForm = (field, value) => {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  };

  const addEquipment = (event) => {
    event.preventDefault();

    if (!form.name.trim()) {
      alert("장비 이름을 입력해 주세요.");
      return;
    }

    const item = {
      id: crypto.randomUUID(),
      name: form.name.trim(),
      type: form.type,
      level: Math.max(0, Number(form.level) || 0),
    };

    setEquipment((current) => [item, ...current]);
    setForm({ ...emptyForm });
  };

  const deleteEquipment = (id) => {
    if (!window.confirm("이 장비를 진열대에서 삭제할까요?")) {
      return;
    }

    setEquipment((current) =>
      current.filter((item) => item.id !== id)
    );
  };

  const previewStats = calculateStats(form);

  return (
    <main className="app">
      <header className="topbar">
        <a className="brand" href="#home">
          <span className="brand-icon">◆</span>
          진열대
        </a>
        <span className="local-badge">개인 진열대 미리보기</span>
      </header>

      <section className="hero" id="home">
        <p className="eyebrow">MINECRAFT EQUIPMENT SHOWCASE</p>
        <h1>
          나만의 장비를
          <br />
          <span>진열하고 강화하세요.</span>
        </h1>
        <p className="hero-description">
          장비를 등록하고 강화 단계에 따른 능력치를 확인하세요.
        </p>
      </section>

      <section className="summary-grid">
        <div className="summary-card">
          <span>등록 장비</span>
          <strong>
            {equipment.length}
            <small> 개</small>
          </strong>
        </div>
      </section>

      <section className="workspace">
        <div className="panel form-panel">
          <div className="section-heading">
            <div>
              <p className="eyebrow">NEW EQUIPMENT</p>
              <h2>장비 등록하기</h2>
            </div>
            <span className="heading-icon">＋</span>
          </div>

          <form onSubmit={addEquipment}>
            <label className="field">
              <span>장비 이름</span>
              <input
                type="text"
                placeholder="예: 전설의 다이아몬드 투구"
                value={form.name}
                onChange={(event) =>
                  updateForm("name", event.target.value)
                }
                maxLength={50}
                required
              />
            </label>

            <label className="field">
              <span>장비 종류</span>
              <select
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
            </label>

            <div className="form-divider" />

            <h3 className="subheading">강화 설정</h3>

            <label className="field">
              <span>강화 단계 (+)</span>
              <input
                type="number"
                min="0"
                step="1"
                value={form.level}
                onChange={(event) =>
                  updateForm("level", event.target.value)
                }
                required
              />
            </label>

            <p className="field-note">
              {form.type === "투구" &&
                "경험치 획득량: 강화 단계에 따라 0.2%씩 증가합니다."}
              {form.type === "갑옷" &&
                "공격력 증가량은 강화 단계 + 1입니다."}
              {form.type === "허리띠" &&
                "드랍률: 강화 단계에 따라 0.2%씩 증가합니다."}
              {form.type === "신발" &&
                "공격력 증가량은 강화 단계당 0.3%입니다."}
            </p>

            <div className="preview-box">
              <span>최종 능력치 미리보기</span>
              <div className="preview-stats">
                <span>
                  {previewStats.icon} {previewStats.label}{" "}
                  <b>
                    +{formatStat(
                      previewStats.value,
                      previewStats.unit
                    )}{previewStats.unit}
                  </b>
                </span>
              </div>
            </div>

            <button className="primary-button" type="submit">
              ＋ 장비 진열하기
            </button>
          </form>
        </div>

        <div className="display-panel">
          <div className="section-heading display-heading">
            <div>
              <p className="eyebrow">MY COLLECTION</p>
              <h2>나의 진열대</h2>
            </div>
            <span className="count-badge">{equipment.length}개</span>
          </div>

          {equipment.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">◇</div>
              <h3>아직 등록된 장비가 없습니다.</h3>
              <p>
                왼쪽에서 첫 번째 장비를 등록하고
                <br />
                나만의 진열대를 만들어 보세요.
              </p>
            </div>
          ) : (
            <div className="equipment-grid">
              {equipment.map((item) => {
                const stats = calculateStats(item);

                return (
                  <article
                    className="equipment-card"
                    key={item.id}
                  >
                    <div className="equipment-card-top">
                      <span className="type-badge">
                        {item.type}
                      </span>
                      <button
                        className="delete-button"
                        type="button"
                        onClick={() => deleteEquipment(item.id)}
                        aria-label={`${item.name} 삭제`}
                        title="장비 삭제"
                      >
                        ×
                      </button>
                    </div>

                    <div className="equipment-art">
                      <span>{stats.icon}</span>
                    </div>

                    <div className="equipment-info">
                      <h3>{item.name}</h3>
                      <span className="enhance-level">
                        +{item.level} 강화
                      </span>
                    </div>

                    <div className="equipment-stats">
                      <div>
                        <span>
                          {stats.icon} {stats.label}
                        </span>
                        <strong>
                          +{formatStat(stats.value, stats.unit)}
                          {stats.unit}
                        </strong>
                      </div>
                    </div>

                    <div className="equipment-footer">
                      <span>강화 적용 완료</span>
                      <span className="status-dot" />
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </div>
      </section>

      <footer className="footer">
        <span>진열대</span>
        <p>나만의 장비를 기록하고 공유하는 공간</p>
        <small>
          현재 버전은 브라우저 로컬 저장 방식이며,
          다른 사용자와 데이터가 공유되지는 않습니다.
        </small>
      </footer>
    </main>
  );
}

export default App;
