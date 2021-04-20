export type infoType = 'commits' | 'issues'

export type repoInfo<T> = T extends 'commits' ? commits : IReply

export interface commits {
    firstLink: string,
    info: string
}