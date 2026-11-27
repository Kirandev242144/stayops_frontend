const TrialCard = ({
  planName,
  trialDaysLeft,
  amountToday,
  progress,
  isTrial,
  collapsed,
}) => {

  if (collapsed) {
    return null;
  }

  return (
    <div className="trial-card">

      <div className="trial-header">

        <span className="trial-title">
          {isTrial ? "🎉 Free Trial" : planName}
        </span>

        <span className="trial-days">
          {trialDaysLeft} days left
        </span>

      </div>


      <div className="trial-progress">

        <div
          className="trial-progress-fill"
          style={{ width: `${progress}%` }}
        />

      </div>


      <p className="trial-plan">
        {planName} • ₹{amountToday} today
      </p>

    </div>
  );
};

export default TrialCard;