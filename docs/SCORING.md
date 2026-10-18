# Veloce ATS: Deterministic AI Match Scoring Engine

Veloce ATS uses a 100% deterministic, zero-hallucination candidate match scoring algorithm (`computeAiMatchScore`) defined in `src/lib/scoring-engine.ts`. 

Unlike black-box LLM prompts, this engine produces mathematically reproducible scores between 0 and 100, generates complete component breakdowns, isolates risk flags, and executes in sub-millisecond time.

---

## 1. Mathematical Formulation

The total match score $S_{\text{total}} \in [0, 100]$ is a linear combination of four weighted sub-scores:

$$S_{\text{total}} = \text{round}\left( 0.40 \cdot S_{\text{skills}} + 0.25 \cdot S_{\text{exp}} + 0.15 \cdot S_{\text{comp}} + 0.20 \cdot S_{\text{domain}} \right)$$

---

## 2. Component Formulas

### 2.1. Skills Fit ($S_{\text{skills}}$, Weight = 40%)

Skills are matched against the canonical skills dictionary (`src/lib/skills-dictionary.ts`) with alias normalization (e.g., `k8s` $\to$ `kubernetes`, `golang` $\to$ `go`, `react.js` $\to$ `react`).

Let:
- $R$ = set of required skills specified on the job requisition
- $N$ = set of nice-to-have skills
- $C$ = set of normalized candidate skills

$$\text{reqCov} = \frac{|R \cap C|}{|R|}, \quad \text{niceCov} = \frac{|N \cap C|}{\max(1, |N|)}$$

$$S_{\text{skills}} = \min\left(100, \max\left(0, \text{round}\left( 100 \cdot (0.85 \cdot \text{reqCov} + 0.15 \cdot \text{niceCov}) \right)\right)\right)$$

### 2.2. Experience Fit ($S_{\text{exp}}$, Weight = 25%)

Let $y$ be candidate experience in years, $y_{\min}$ be job minimum years, and $y_{\max}$ be job maximum years:

$$S_{\text{exp}} = \begin{cases} 
\max(0, 100 - 22 \cdot (y_{\min} - y)) & \text{if } y < y_{\min} \quad (\text{steep penalty for under-experience}) \\
100 & \text{if } y_{\min} \le y \le y_{\max} \quad (\text{ideal target range}) \\
\max(40, 100 - 8 \cdot (y - y_{\max})) & \text{if } y > y_{\max} \quad (\text{gentle taper for over-qualification})
\end{cases}$$

### 2.3. Compensation Fit ($S_{\text{comp}}$, Weight = 15%)

Let $E$ be candidate expected salary, $S_{\min}$ and $S_{\max}$ be the job's salary band:

$$S_{\text{comp}} = \begin{cases} 
100 & \text{if } E \le S_{\max} \\
70 & \text{if } S_{\max} < E \le 1.10 \cdot S_{\max} \quad (\le 10\% \text{ above band}) \\
40 & \text{if } 1.10 \cdot S_{\max} < E \le 1.25 \cdot S_{\max} \quad (10\text{–}25\% \text{ above band}) \\
10 & \text{if } E > 1.25 \cdot S_{\max} \quad (> 25\% \text{ above band}) \\
70 & \text{if } E \text{ is missing/unspecified (neutral prior)}
\end{cases}$$

### 2.4. Domain & Title Fit ($S_{\text{domain}}$, Weight = 20%)

Let $D$ be the set of domain keywords on the job requisition. Candidate text corpus (parsed resume text, current title, company name, skills) is tokenized with stop-word filtering.

Let $d_{\text{matched}}$ be the count of multi-token keywords fully satisfied in the corpus:

$$\text{baseScore} = \begin{cases} 
100 & \text{if } |D| = 0 \\
100 \cdot \frac{d_{\text{matched}}}{|D|} & \text{if } |D| > 0 
\end{cases}$$

If candidate's current title shares $\ge 1$ non-stopword with the target job title, an additional **+10 title bonus** is awarded:

$$S_{\text{domain}} = \min(100, \text{baseScore} + \text{titleBonus})$$

---

## 3. Worked Example (Real Seed Candidate: Devon Miller)

Candidate: **Devon Miller** (`CAND-1004`)  
Job: **ML Infrastructure Engineer** (`REQ-2026-02`)  
- Job Requirements:
  - Required Skills: `[Python, Kubernetes, Docker, AWS]` (4 skills)
  - Nice-to-Have: `[Terraform, Prometheus]` (2 skills)
  - Experience Band: `5` to `11` years
  - Salary Band: `$190,000` to `$240,000`
  - Domain Keywords: `[Distributed Systems, High Throughput, GPU, CUDA]`
- Candidate Attributes:
  - Skills: `[Python, Kubernetes, Docker, AWS, Terraform, Prometheus]`
  - Experience: `7 years`
  - Expected Salary: `$210,000`
  - Current Title: `Cloud Infrastructure Engineer`

### Calculation Walkthrough:

1. **Skills Fit**:
   - Required matched: 4 / 4 $\to$ $\text{reqCov} = 1.0$
   - Nice-to-have matched: 2 / 2 $\to$ $\text{niceCov} = 1.0$
   - $S_{\text{skills}} = 100 \cdot (0.85 \cdot 1.0 + 0.15 \cdot 1.0) = \mathbf{100}$
2. **Experience Fit**:
   - $y = 7$, which lies in $[5, 11]$
   - $S_{\text{exp}} = \mathbf{100}$
3. **Compensation Fit**:
   - $E = 210,000 \le 240,000$ (within band)
   - $S_{\text{comp}} = \mathbf{100}$
4. **Domain Fit**:
   - Domain keyword match ratio + title overlap bonus: $S_{\text{domain}} = \mathbf{85}$
5. **Total Score**:
   $$S_{\text{total}} = \text{round}(0.40 \cdot 100 + 0.25 \cdot 100 + 0.15 \cdot 100 + 0.20 \cdot 85) = \text{round}(40 + 25 + 15 + 17) = \mathbf{97}$$

Resulting badge rendered in UI: **97 (Exceptional Fit, Emerald)**.

---

## 4. Automatic Risk Flags

When calculating scores, the engine automatically tags candidate profiles with structured risk indicators:

| Flag Name | Trigger Condition | Severity |
|---|---|---|
| `EXPECTED_SALARY_ABOVE_BAND` | $E > S_{\max}$ | High |
| `NOTICE_PERIOD_GT_60D` | $\text{noticePeriodDays} > 60$ | Medium |
| `OVERQUALIFIED` | $y > y_{\max} + 3$ | Low |
| `UNDER_EXPERIENCED` | $y < y_{\min}$ | High |
| `MISSING_CORE_SKILL:<skill>` | Required skill not found in candidate skills | Medium |
