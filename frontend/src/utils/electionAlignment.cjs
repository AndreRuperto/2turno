function axisDifferences(scores, candidateScores, axes)
{
    return axes.map(axis =>
    {
        const userScore = scores[axis.id];
        const candidateScore = candidateScores[axis.id];
        if (![userScore, candidateScore].every(value => Number.isFinite(value) && value >= 0 && value <= 100))
            throw new Error('Every axis requires a valid score between 0 and 100.');
        return { label: axis.label, distance: Math.abs(userScore - candidateScore) };
    }).sort((first, second) => first.distance - second.distance);
}



function alignmentAreas(scores, candidateScores, axes)
{
    const differences = axisDifferences(scores, candidateScores, axes);
    return {
        aligned: differences.filter(area => area.distance <= 20).slice(0, 2).map(area => area.label),
        different: differences.filter(area => area.distance >= 35).reverse().slice(0, 2).map(area => area.label)
    };
}



function compareProfiles(scores, candidates, axes)
{
    if (!axes.length || !candidates.length) throw new Error('Profiles and axes are required.');
    const ranked = candidates.map(candidate =>
    {
        const differences = axisDifferences(scores, candidate.scores, axes);
        const distance = differences.reduce((total, area) => total + area.distance, 0) / axes.length;
        return { ...candidate, distance, compatibility: Math.round((100 - distance) * 10) / 10 };
    }).sort((first, second) => first.distance - second.distance);
    return {
        candidates: ranked,
        closestCandidateIds: ranked.filter(candidate => Math.abs(candidate.distance - ranked[0].distance) < 0.0000001).map(candidate => candidate.id)
    };
}

module.exports = { alignmentAreas, compareProfiles };
