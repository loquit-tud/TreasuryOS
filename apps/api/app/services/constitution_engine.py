from app.schemas.models import Constitution, Decision, ProposalCreate


def evaluate_proposal(constitution: Constitution, proposal: ProposalCreate) -> Decision:
    reasons: list[str] = []
    violated_rules: list[str] = []

    if proposal.proposed_stable_reserve_pct < constitution.stable_reserve_min_pct:
        violated_rules.append("stable_reserve_min_pct")
        reasons.append(
            "Stable reserve would drop below the vault's constitutional minimum."
        )

    if proposal.proposed_drawdown_pct > constitution.max_drawdown_pct:
        violated_rules.append("max_drawdown_pct")
        reasons.append("Projected drawdown exceeds the constitutional limit.")

    if proposal.proposed_rwa_exposure_pct > constitution.rwa_exposure_max_pct:
        violated_rules.append("rwa_exposure_max_pct")
        reasons.append(
            "Proposed illiquid / non-stable sleeve would exceed the constitutional cap."
        )

    if not constitution.leverage_allowed and proposal.proposed_leverage_enabled:
        violated_rules.append("leverage_allowed")
        reasons.append("The constitution forbids leverage for this vault.")

    if violated_rules:
        return Decision(decision="REJECT", reasons=reasons, violated_rules=violated_rules)

    return Decision(
        decision="ALLOW",
        reasons=["The proposal complies with the active constitutional mandates."],
        violated_rules=[],
    )
