import { Statistic } from "antd";

function StatCard({
  title,
  value,
  suffix,
  icon,
  tone = "blue",
  note,
  precision,
}) {
  return (
    <div
      className={`admin-stat-card tone-${tone}`}
    >
      <div className="admin-stat-top">
        <div className="admin-stat-icon">
          {icon}
        </div>

        {note && (
          <span className="admin-stat-note">
            {note}
          </span>
        )}
      </div>

      <Statistic
        title={title}
        value={value}
        suffix={suffix}
        precision={precision}
      />
    </div>
  );
}

export default StatCard;