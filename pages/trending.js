import useSWR from "swr";

const fetcher = (url) => fetch(url).then((res) => res.json());

export default function Events() {
  const { data, error } = useSWR("/api/trending", fetcher, {
    refreshInterval: 1000 * 60 * 5,
  });

  console.log(data);

  if (error) return <div>Failed to load</div>;
  if (!data) return <div>Loading...</div>;

  return (
    <div>
      {data.map((issue) => (
        <div key={issue.id}>
          <pre>
            {issue.repo}|👍 {issue["+1"]} | 👎 {issue["-1"]}| 👀 {issue.eyes} |{" "}
            {issue.title} | {issue.html_url}
          </pre>
        </div>
      ))}
    </div>
  );
}
