import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { Link, useNavigate } from "react-router";
import type { RootState } from "../../store";
import api from "../../utils/api";
import { Badge, Skeleton, Button } from "../../lib/ui";
import {
  Users,
  Briefcase,
  Clock,
  CheckCircle2,
  ArrowUpRight,
  Plus,
} from "lucide-react";
import styles from "./Home.module.scss";

interface DashboardStats {
  role: string;
  totalEmployees: number;
  totalProjects: number;
  projectsInProgress: number;
  completedProjects: number;
  pendingProjects: number;
  recentProjects: any[];
  monthlyActivity: { label: string; count: number }[];
}

export const Home: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useSelector((state: RootState) => state.auth);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        const res = await api.get("/dashboard/stats");
        setStats(res.data.data);
      } catch (err) {
        console.error("Failed to load dashboard stats", err);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  return (
    <div className={styles.container}>
      {}
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.title}>
            Welcome back, {user?.name?.split(" ")[0]}
          </h1>
          <p className={styles.subtitle}>
            Here's what's happening across your projects and team today.
          </p>
        </div>

        <div className={styles.actions}>
          <Link to="/projects">
            <Button variant="secondary" size="md" icon={<Briefcase size={16} />}>
              View Projects
            </Button>
          </Link>
          {(user?.role === "owner" || user?.role === "project_manager") && (
            <Link to="/projects">
              <Button variant="primary" size="md" icon={<Plus size={16} />}>
                New Project
              </Button>
            </Link>
          )}
        </div>
      </div>

      {}
      <div className={styles.metricsGrid}>
        <div
          className={styles.metricCard}
          onClick={() => navigate("/employees")}
          title="View all employees"
        >
          <div className={styles.metricHeader}>
            <span className={styles.metricLabel}>
              {user?.role === "owner"
                ? "Total Employees"
                : user?.role === "project_manager"
                ? "Team Members"
                : "Active Colleagues"}
            </span>
            <span className={styles.metricIcon}>
              <Users size={18} />
            </span>
          </div>
          {loading ? (
            <Skeleton height={36} width={80} />
          ) : (
            <div className={styles.metricValue}>{stats?.totalEmployees || 0}</div>
          )}
          <span className={styles.metricContext}>Across departments &rarr;</span>
        </div>

        <div
          className={styles.metricCard}
          onClick={() => navigate("/projects")}
          title="View all projects"
        >
          <div className={styles.metricHeader}>
            <span className={styles.metricLabel}>Total Projects</span>
            <span className={styles.metricIcon}>
              <Briefcase size={18} />
            </span>
          </div>
          {loading ? (
            <Skeleton height={36} width={80} />
          ) : (
            <div className={styles.metricValue}>{stats?.totalProjects || 0}</div>
          )}
          <span className={styles.metricContext}>Managed & assigned &rarr;</span>
        </div>

        <div
          className={styles.metricCard}
          onClick={() => navigate("/projects?status=In Progress")}
          title="View projects in progress"
        >
          <div className={styles.metricHeader}>
            <span className={styles.metricLabel}>In Progress</span>
            <span className={styles.metricIcon}>
              <Clock size={18} />
            </span>
          </div>
          {loading ? (
            <Skeleton height={36} width={80} />
          ) : (
            <div className={styles.metricValue}>{stats?.projectsInProgress || 0}</div>
          )}
          <span className={styles.metricContext}>Currently active &rarr;</span>
        </div>

        <div
          className={styles.metricCard}
          onClick={() => navigate("/projects?status=Completed")}
          title="View completed projects"
        >
          <div className={styles.metricHeader}>
            <span className={styles.metricLabel}>Completed</span>
            <span className={styles.metricIcon}>
              <CheckCircle2 size={18} />
            </span>
          </div>
          {loading ? (
            <Skeleton height={36} width={80} />
          ) : (
            <div className={styles.metricValue}>{stats?.completedProjects || 0}</div>
          )}
          <span className={styles.metricContext}>Successfully delivered &rarr;</span>
        </div>
      </div>

      {}
      <div className={styles.contentGrid}>
        {}
        <div className={styles.telemetryCard}>
          <div className={styles.sectionHeader}>
            <div>
              <h2 className={styles.sectionTitle}>Weekly Project Velocity</h2>
              <p className={styles.sectionSubtitle}>Committed actions and milestone logs</p>
            </div>
            <Badge variant="lime" size="sm">
              Live
            </Badge>
          </div>

          <div className={styles.chartBars}>
            {stats?.monthlyActivity?.map((item, idx) => (
              <div key={idx} className={styles.barColumn}>
                <div className={styles.barTrack}>
                  <div
                    className={styles.barFill}
                    style={{ height: `${Math.min(item.count * 3, 100)}%` }}
                  />
                </div>
                <span className={styles.barLabel}>{item.label}</span>
              </div>
            ))}
          </div>

          <div className={styles.chartFooter}>
            <div
              className={styles.statPill}
              onClick={() => navigate("/projects?status=Pending")}
              title="Filter pending projects"
            >
              <span className={styles.pillValue}>{stats?.pendingProjects || 0}</span>
              <span className={styles.pillLabel}>Pending Kickoff</span>
            </div>
            <div
              className={styles.statPill}
              onClick={() => navigate("/projects?status=In Progress")}
              title="Filter in-progress projects"
            >
              <span className={styles.pillValue}>{stats?.projectsInProgress || 0}</span>
              <span className={styles.pillLabel}>In Development</span>
            </div>
            <div
              className={styles.statPill}
              onClick={() => navigate("/projects?status=Completed")}
              title="Filter completed projects"
            >
              <span className={styles.pillValue}>{stats?.completedProjects || 0}</span>
              <span className={styles.pillLabel}>Archived / Done</span>
            </div>
          </div>
        </div>

        {}
        <div className={styles.recentProjectsCard}>
          <div className={styles.sectionHeader}>
            <div>
              <h2 className={styles.sectionTitle}>Recent Projects</h2>
              <p className={styles.sectionSubtitle}>Latest team assignments and deliverables</p>
            </div>
            <Link to="/projects" className={styles.viewAllLink}>
              View all <ArrowUpRight size={14} />
            </Link>
          </div>

          {loading ? (
            <div className={styles.skeletonList}>
              <Skeleton height={48} />
              <Skeleton height={48} />
              <Skeleton height={48} />
            </div>
          ) : stats?.recentProjects?.length === 0 ? (
            <div className={styles.emptyRecent}>
              <Briefcase size={28} className={styles.emptyIcon} />
              <p>No active projects found.</p>
            </div>
          ) : (
            <div className={styles.projectList}>
              {stats?.recentProjects?.map((project) => (
                <div
                  key={project._id}
                  className={styles.projectItem}
                  onClick={() => navigate(`/projects/${project._id}`)}
                  style={{ cursor: "pointer" }}
                >
                  <div className={styles.projectMain}>
                    <h4 className={styles.projectName}>{project.projectName}</h4>
                    <p className={styles.projectDesc}>{project.description}</p>
                  </div>
                  <div className={styles.projectMeta}>
                    <Badge
                      variant={
                        project.status === "Completed"
                          ? "success"
                          : project.status === "In Progress"
                          ? "lime"
                          : "warning"
                      }
                      size="sm"
                    >
                      {project.status}
                    </Badge>
                    <span className={styles.projectDate}>
                      Due {new Date(project.deadline).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Home;
